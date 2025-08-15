from uuid import UUID, uuid4

from schemas.stop_conditions import (
    EvaluateMetrics,
    StopCondition,
    StopConditionCreate,
    StopConditionUpdate,
)


class StopConditionService:
    """In-memory storage and evaluation of stop conditions."""

    def __init__(self) -> None:
        self.store: dict[UUID, StopCondition] = {}

    def list(self) -> list[StopCondition]:
        return list(self.store.values())

    def create(self, data: StopConditionCreate) -> StopCondition:
        cond = StopCondition(id=uuid4(), **data.model_dump())
        self.store[cond.id] = cond
        return cond

    def update(
        self, condition_id: UUID, data: StopConditionUpdate
    ) -> StopCondition:
        if condition_id not in self.store:
            raise KeyError(condition_id)
        current = self.store[condition_id]
        updates = data.model_dump(exclude_unset=True, exclude_none=True)
        cond = current.model_copy(update=updates)
        self.store[condition_id] = cond
        return cond

    def delete(self, condition_id: UUID) -> None:
        if condition_id not in self.store:
            raise KeyError(condition_id)
        del self.store[condition_id]

    def evaluate(self, metrics: EvaluateMetrics) -> tuple[bool, str | None]:
        metric_map = {
            "error_rate": metrics.error_rate,
            "success_rate": metrics.success_rate,
            "duration": metrics.duration,
            "total_tests": metrics.total_tests,
        }
        for cond in self.store.values():
            if not cond.enabled:
                continue
            current = metric_map[cond.type]
            if self._compare(current, cond.operator, cond.value):
                return (True, cond.type)
        return (False, None)

    @staticmethod
    def _compare(current: float, op: str, value: float) -> bool:
        if op == ">":
            return current > value
        if op == ">=":
            return current >= value
        if op == "<":
            return current < value
        if op == "<=":
            return current <= value
        return False


stop_condition_service = StopConditionService()
