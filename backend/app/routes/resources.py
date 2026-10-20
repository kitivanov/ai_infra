from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.dependencies.auth import get_current_user


def create_resource_router(model, create_schema, update_schema, read_schema, resource_name: str):
    router = APIRouter(prefix=f"/{resource_name}", tags=[resource_name])

    @router.get("", response_model=list[read_schema])
    def list_resources(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
        return db.scalars(
            select(model).options(selectinload(model.owner)).order_by(model.id)
        ).all()

    @router.get("/{resource_id}", response_model=read_schema)
    def get_resource(
        resource_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        resource = db.scalar(
            select(model).options(selectinload(model.owner)).where(model.id == resource_id)
        )
        if not resource:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} resource not found")
        return resource

    @router.post("", response_model=read_schema, status_code=status.HTTP_201_CREATED)
    def create_resource(
        payload: create_schema,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        resource = model(**payload.model_dump(), owner_id=current_user.id)
        db.add(resource)
        db.commit()
        db.refresh(resource)
        return resource

    @router.put("/{resource_id}", response_model=read_schema)
    def update_resource(
        resource_id: int,
        payload: update_schema,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        resource = db.get(model, resource_id)
        if not resource:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} resource not found")
        if resource.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can update this resource")
        values = payload.model_dump()
        if model is models.Model and not values.get("api_key"):
            values.pop("api_key")
        for field, value in values.items():
            setattr(resource, field, value)
        db.commit()
        db.refresh(resource)
        return resource

    @router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_resource(
        resource_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
    ):
        resource = db.get(model, resource_id)
        if not resource:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource_name} resource not found")
        if resource.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can delete this resource")
        if getattr(resource, "agents", []):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"This {resource_name} resource is used by agents")
        db.delete(resource)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"This {resource_name} resource is used by agents")

    return router


models_router = create_resource_router(models.Model, schemas.ModelCreate, schemas.ModelUpdate, schemas.ModelRead, "models")
rags_router = create_resource_router(models.Rag, schemas.RagCreate, schemas.RagUpdate, schemas.RagRead, "rags")
mcps_router = create_resource_router(models.Mcp, schemas.McpCreate, schemas.McpUpdate, schemas.McpRead, "mcps")
