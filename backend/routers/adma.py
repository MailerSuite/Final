"""
ADMA FastAPI Router
REST API endpoints for ADMA system management and monitoring
"""

from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from adma.config import config
from adma.service import adma_service
from routers.auth import get_current_user
from schemas.auth import User

router = APIRouter(prefix="/adma", tags=["Admin"])


# Request/Response Models
class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    components: dict[str, str]
    statistics: dict[str, Any]
    configuration: dict[str, Any]
    issues: list[str] | None = None


class StatisticsResponse(BaseModel):
    service: dict[str, Any]
    ai_engine: dict[str, Any]
    decision_engine: dict[str, Any]
    remediation_engine: dict[str, Any]
    observability: dict[str, Any]
    feedback_loop: dict[str, Any]


class ManualRemediationRequest(BaseModel):
    action_type: str = Field(..., description="Type of action to execute")
    parameters: dict[str, Any] = Field(
        default_factory=dict, description="Action parameters"
    )


class ManualRemediationResponse(BaseModel):
    success: bool
    action_id: str
    status: str
    output: str
    error: str | None = None
    duration: float


class FailureSimulationRequest(BaseModel):
    failure_type: str = Field(..., description="Type of failure to simulate")


class FailureSimulationResponse(BaseModel):
    success: bool
    failure_type: str
    anomaly: dict[str, Any]
    message: str
    error: str | None = None


@router.get("/health", response_model=HealthResponse)
async def get_adma_health():
    """Get ADMA system health status"""
    try:
        health_data = await adma_service.health_check()
        return HealthResponse(**health_data)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Health check failed: {str(e)}"
        )


@router.get("/statistics", response_model=StatisticsResponse)
async def get_adma_statistics(current_user: User = Depends(get_current_user)):
    """Get detailed ADMA system statistics"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        stats = adma_service.get_statistics()
        return StatisticsResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get statistics: {str(e)}"
        )


@router.post("/start")
async def start_adma_service(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Start the ADMA service"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    if adma_service.is_running:
        return {"message": "ADMA service is already running"}

    try:
        background_tasks.add_task(adma_service.start)
        return {"message": "ADMA service start initiated"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start ADMA service: {str(e)}"
        )


@router.post("/stop")
async def stop_adma_service(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Stop the ADMA service"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    if not adma_service.is_running:
        return {"message": "ADMA service is not running"}

    try:
        background_tasks.add_task(adma_service.stop)
        return {"message": "ADMA service stop initiated"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to stop ADMA service: {str(e)}"
        )


@router.post("/remediation/manual", response_model=ManualRemediationResponse)
async def execute_manual_remediation(
    request: ManualRemediationRequest,
    current_user: User = Depends(get_current_user),
):
    """Manually execute a remediation action"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        result = await adma_service.manual_remediation(
            action_type=request.action_type, parameters=request.parameters
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return ManualRemediationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Manual remediation failed: {str(e)}"
        )


@router.post("/simulate/failure", response_model=FailureSimulationResponse)
async def simulate_failure(
    request: FailureSimulationRequest,
    current_user: User = Depends(get_current_user),
):
    """Simulate a system failure for testing purposes"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    if not config.remediation_engine.dry_run_mode:
        raise HTTPException(
            status_code=400,
            detail="Failure simulation only available in dry run mode",
        )

    try:
        result = await adma_service.simulate_failure(request.failure_type)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return FailureSimulationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failure simulation failed: {str(e)}"
        )


@router.get("/configuration")
async def get_adma_configuration(
    current_user: User = Depends(get_current_user),
):
    """Get current ADMA configuration"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        return {
            "ai_engine": {
                "anomaly_detection_enabled": config.ai_engine.anomaly_detection_enabled,
                "llm_analysis_enabled": config.ai_engine.llm_analysis_enabled,
                "anomaly_threshold_cpu": config.ai_engine.anomaly_threshold_cpu,
                "anomaly_threshold_memory": config.ai_engine.anomaly_threshold_memory,
                "anomaly_threshold_error_rate": config.ai_engine.anomaly_threshold_error_rate,
                "ml_model_type": config.ai_engine.ml_model_type,
            },
            "decision_engine": {
                "confidence_threshold": config.decision_engine.confidence_threshold,
                "human_intervention_threshold": config.decision_engine.human_intervention_threshold,
                "max_auto_actions_per_hour": config.decision_engine.max_auto_actions_per_hour,
                "cooldown_minutes": config.decision_engine.cooldown_minutes,
            },
            "remediation_engine": {
                "enable_auto_remediation": config.remediation_engine.enable_auto_remediation,
                "dry_run_mode": config.remediation_engine.dry_run_mode,
                "max_concurrent_actions": config.remediation_engine.max_concurrent_actions,
                "kubernetes_enabled": config.remediation_engine.kubernetes_enabled,
                "ssh_enabled": config.remediation_engine.ssh_enabled,
                "docker_enabled": config.remediation_engine.docker_enabled,
            },
            "feedback": {
                "learning_enabled": config.feedback.learning_enabled,
                "success_threshold": config.feedback.success_threshold,
                "learning_rate": config.feedback.learning_rate,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get configuration: {str(e)}"
        )


@router.get("/playbooks")
async def get_playbooks(current_user: User = Depends(get_current_user)):
    """Get available remediation playbooks"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        playbooks = adma_service.decision_engine.playbooks

        playbook_info = {}
        for name, playbook in playbooks.items():
            playbook_info[name] = {
                "description": playbook.description,
                "priority": playbook.priority,
                "cooldown_minutes": playbook.cooldown_minutes,
                "requires_approval": playbook.requires_approval,
                "max_executions_per_hour": playbook.max_executions_per_hour,
                "conditions": playbook.conditions,
                "actions": [
                    {
                        "type": action.get("type"),
                        "description": action.get("description", ""),
                        "risk_level": action.get("risk_level", "medium"),
                    }
                    for action in playbook.actions
                ],
            }

        return {"playbooks": playbook_info}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get playbooks: {str(e)}"
        )


@router.post("/playbooks/reload")
async def reload_playbooks(current_user: User = Depends(get_current_user)):
    """Reload playbooks from disk"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        count = adma_service.decision_engine.reload_playbooks()
        return {
            "message": f"Successfully reloaded {count} playbooks",
            "count": count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to reload playbooks: {str(e)}"
        )


@router.get("/anomalies/recent")
async def get_recent_anomalies(
    limit: int = 50, current_user: User = Depends(get_current_user)
):
    """Get recent anomalies detected by ADMA"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        anomalies = adma_service.ai_engine.anomaly_history[-limit:]

        return {
            "anomalies": [
                {
                    "timestamp": anomaly.timestamp.isoformat(),
                    "metric_name": anomaly.metric_name,
                    "value": anomaly.value,
                    "threshold": anomaly.threshold,
                    "severity": anomaly.severity,
                    "confidence": anomaly.confidence,
                    "context": anomaly.context,
                }
                for anomaly in anomalies
            ],
            "total": len(anomalies),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recent anomalies: {str(e)}"
        )


@router.get("/decisions/recent")
async def get_recent_decisions(
    limit: int = 50, current_user: User = Depends(get_current_user)
):
    """Get recent decisions made by ADMA"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        decisions = adma_service.decision_engine.execution_history[-limit:]

        return {
            "decisions": [
                {
                    "decision_id": decision["decision_id"],
                    "timestamp": decision["timestamp"],
                    "anomaly_metric": decision["anomaly_metric"],
                    "anomaly_value": decision["anomaly_value"],
                    "decision_type": decision["decision_type"],
                    "actions_count": decision["actions_count"],
                    "approval_required": decision["approval_required"],
                }
                for decision in decisions
            ],
            "total": len(decisions),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recent decisions: {str(e)}"
        )


@router.get("/learning/insights")
async def get_learning_insights(
    metric_name: str | None = None,
    current_user: User = Depends(get_current_user),
):
    """Get insights from the learning system"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        insights = adma_service.feedback_loop.get_learning_insights(
            metric_name
        )
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get learning insights: {str(e)}",
        )


@router.post("/learning/trigger")
async def trigger_learning_cycle(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Manually trigger a learning cycle"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        background_tasks.add_task(
            adma_service.feedback_loop.run_learning_cycle
        )
        return {"message": "Learning cycle triggered"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger learning cycle: {str(e)}",
        )
