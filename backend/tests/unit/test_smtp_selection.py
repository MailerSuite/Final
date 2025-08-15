import math
import types

from services.smtp_selection_service import _compute_score


class Obj:
    pass


def make_row(status=None, response_time=None, last_checked=None):
    r = Obj()
    r.status = status
    r.response_time = response_time
    r.last_checked = last_checked
    return r


def test_score_prefers_valid_over_invalid():
    a = make_row(status="valid", response_time=1.0)
    b = make_row(status="invalid", response_time=0.1)
    assert _compute_score(a) > _compute_score(b)


def test_score_penalizes_higher_response_time():
    fast = make_row(status="checked", response_time=0.1)
    slow = make_row(status="checked", response_time=2.0)
    assert _compute_score(fast) > _compute_score(slow)


def test_score_bounds():
    r = make_row(status="valid", response_time=0.0)
    s = _compute_score(r)
    assert 0.0 <= s <= 120.0

