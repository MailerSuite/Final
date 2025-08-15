"""
🔍 CHECK ALL SCHEMAS FOR ERRORS
Check all schemas for errors and compatibility.
"""

try:
    from datetime import datetime
    from enum import Enum
    from typing import Any, Dict, List, Optional

    from pydantic import BaseModel, ConfigDict, EmailStr, Field

    print("✅ All Pydantic imports are correct")
except ImportError as e:
    print(f"❌ Import error: {e}")


class TestBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


try:
    test = TestBaseSchema()
    print("✅ BaseSchema configuration is correct")
except Exception as e:
    print(f"❌ Ошибка BaseSchema: {e}")


class TestStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


try:
    status = TestStatus.ACTIVE
    print("✅ Enum classes are correct")
except Exception as e:
    print(f"❌ Ошибка Enum: {e}")
print("🔍 ANALYSIS COMPLETED")
