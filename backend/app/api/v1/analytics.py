"""Analytics routes."""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...core.security import verify_api_key
from ...db.session import get_session
from ...schemas.common import success_response
from ...services.analytics_service import analytics_service

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("/summary")
def get_dashboard_summary(session: Session = Depends(get_session)):
    summary = analytics_service.get_dashboard_summary(session)
    return success_response(summary)


@router.get("/study-trends")
def get_study_trends(
    days: int = Query(default=7, ge=1, le=30),
    session: Session = Depends(get_session)
):
    trends = analytics_service.get_study_trends(session, days=days)
    return success_response(trends)


@router.get("/tasks")
def get_task_stats(session: Session = Depends(get_session)):
    stats = analytics_service.get_task_completion_rate(session)
    return success_response(stats)


@router.get("/temporal-performance")
def get_temporal_performance(
    days: int = Query(default=30, ge=1, le=90),
    session: Session = Depends(get_session)
):
    perf = analytics_service.get_temporal_performance(session, days=days)
    return success_response(perf)


@router.get("/neural-heatmap")
def get_neural_heatmap(
    days: int = Query(default=365, ge=1, le=730),
    session: Session = Depends(get_session)
):
    heatmap = analytics_service.get_neural_heatmap(session, days=days)
    return success_response(heatmap)


@router.get("/distribution")
def get_distribution(session: Session = Depends(get_session)):
    dist = analytics_service.get_subject_distribution(session)
    return success_response(dist)
