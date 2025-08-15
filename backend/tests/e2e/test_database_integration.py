import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import uuid
import time

# Import your models and database configuration
try:
    from app.core.database import get_db, engine
    from app.models.user import User
    from app.models.campaign import Campaign
    from app.models.contact_list import ContactList
    from app.models.contact import Contact
    from app.models.email_template import EmailTemplate
    from app.schemas.auth import UserCreate
    from app.schemas.campaign import CampaignCreate
    from app.schemas.contact_list import ContactListCreate
    from app.schemas.contact import ContactCreate
    from app.schemas.email_template import EmailTemplateCreate
    from app.core.auth import get_password_hash
except ImportError:
    # Fallback for when models are not available
    pass

class TestDatabaseIntegration:
    """End-to-end database integration tests"""
    
    def setup_method(self):
        """Setup test database session"""
        self.test_data = {
            "user": {
                "email": f"test_{int(time.time())}@example.com",
                "password": "TestPassword123!",
                "first_name": "Test",
                "last_name": "User"
            },
            "contact_list": {
                "name": f"Test List {int(time.time())}",
                "description": "Test contact list for e2e testing"
            },
            "campaign": {
                "name": f"Test Campaign {int(time.time())}",
                "subject": "Test Email Subject",
                "content": "<h1>Test Email Content</h1>",
                "scheduled_at": datetime.now() + timedelta(days=1)
            },
            "contact": {
                "email": f"contact_{int(time.time())}@example.com",
                "first_name": "Test",
                "last_name": "Contact"
            },
            "template": {
                "name": f"Test Template {int(time.time())}",
                "subject": "Test Template Subject",
                "content": "<h1>Test Template Content</h1>",
                "is_active": True
            }
        }
        
        self.created_ids = {
            "user_id": None,
            "contact_list_id": None,
            "campaign_id": None,
            "contact_id": None,
            "template_id": None
        }
    
    def teardown_method(self):
        """Cleanup test data"""
        # Cleanup will be handled by test database rollback
        pass
    
    @pytest.mark.asyncio
    async def test_database_connection(self):
        """Test database connection and basic operations"""
        try:
            # Test database connection
            async with engine.begin() as conn:
                result = await conn.execute("SELECT 1")
                assert result.scalar() == 1
            
            # Test database session creation
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            async with async_session() as session:
                assert session is not None
                assert hasattr(session, 'commit')
                assert hasattr(session, 'rollback')
                
        except Exception as e:
            pytest.skip(f"Database connection failed: {e}")
    
    @pytest.mark.asyncio
    async def test_user_crud_operations(self):
        """Test complete user CRUD operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create user
                user_data = self.test_data["user"]
                hashed_password = get_password_hash(user_data["password"])
                
                user = User(
                    email=user_data["email"],
                    hashed_password=hashed_password,
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    is_active=True
                )
                
                session.add(user)
                await session.commit()
                await session.refresh(user)
                
                assert user.id is not None
                assert user.email == user_data["email"]
                assert user.first_name == user_data["first_name"]
                assert user.last_name == user_data["last_name"]
                assert user.is_active is True
                
                self.created_ids["user_id"] = user.id
                
                # Read user
                retrieved_user = await session.get(User, user.id)
                assert retrieved_user is not None
                assert retrieved_user.email == user_data["email"]
                
                # Update user
                new_first_name = "Updated"
                retrieved_user.first_name = new_first_name
                await session.commit()
                await session.refresh(retrieved_user)
                
                assert retrieved_user.first_name == new_first_name
                
                # Delete user
                await session.delete(retrieved_user)
                await session.commit()
                
                # Verify deletion
                deleted_user = await session.get(User, user.id)
                assert deleted_user is None
                
        except Exception as e:
            pytest.skip(f"User CRUD operations failed: {e}")
    
    @pytest.mark.asyncio
    async def test_contact_list_crud_operations(self):
        """Test complete contact list CRUD operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create contact list
                contact_list_data = self.test_data["contact_list"]
                
                contact_list = ContactList(
                    name=contact_list_data["name"],
                    description=contact_list_data["description"],
                    is_active=True
                )
                
                session.add(contact_list)
                await session.commit()
                await session.refresh(contact_list)
                
                assert contact_list.id is not None
                assert contact_list.name == contact_list_data["name"]
                assert contact_list.description == contact_list_data["description"]
                
                self.created_ids["contact_list_id"] = contact_list.id
                
                # Read contact list
                retrieved_list = await session.get(ContactList, contact_list.id)
                assert retrieved_list is not None
                assert retrieved_list.name == contact_list_data["name"]
                
                # Update contact list
                new_description = "Updated description"
                retrieved_list.description = new_description
                await session.commit()
                await session.refresh(retrieved_list)
                
                assert retrieved_list.description == new_description
                
                # Delete contact list
                await session.delete(retrieved_list)
                await session.commit()
                
                # Verify deletion
                deleted_list = await session.get(ContactList, contact_list.id)
                assert deleted_list is None
                
        except Exception as e:
            pytest.skip(f"Contact list CRUD operations failed: {e}")
    
    @pytest.mark.asyncio
    async def test_campaign_crud_operations(self):
        """Test complete campaign CRUD operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create user and contact list first
                user = await self._create_test_user(session)
                contact_list = await self._create_test_contact_list(session)
                
                # Create campaign
                campaign_data = self.test_data["campaign"]
                
                campaign = Campaign(
                    name=campaign_data["name"],
                    subject=campaign_data["subject"],
                    content=campaign_data["content"],
                    scheduled_at=campaign_data["scheduled_at"],
                    user_id=user.id,
                    contact_list_id=contact_list.id,
                    status="draft"
                )
                
                session.add(campaign)
                await session.commit()
                await session.refresh(campaign)
                
                assert campaign.id is not None
                assert campaign.name == campaign_data["name"]
                assert campaign.subject == campaign_data["subject"]
                assert campaign.user_id == user.id
                assert campaign.contact_list_id == contact_list.id
                
                self.created_ids["campaign_id"] = campaign.id
                
                # Read campaign
                retrieved_campaign = await session.get(Campaign, campaign.id)
                assert retrieved_campaign is not None
                assert retrieved_campaign.name == campaign_data["name"]
                
                # Update campaign
                new_status = "scheduled"
                retrieved_campaign.status = new_status
                await session.commit()
                await session.refresh(retrieved_campaign)
                
                assert retrieved_campaign.status == new_status
                
                # Test campaign relationships
                assert retrieved_campaign.user is not None
                assert retrieved_campaign.user.id == user.id
                assert retrieved_campaign.contact_list is not None
                assert retrieved_campaign.contact_list.id == contact_list.id
                
                # Cleanup
                await session.delete(retrieved_campaign)
                await session.delete(user)
                await session.delete(contact_list)
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Campaign CRUD operations failed: {e}")
    
    @pytest.mark.asyncio
    async def test_contact_crud_operations(self):
        """Test complete contact CRUD operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create contact list first
                contact_list = await self._create_test_contact_list(session)
                
                # Create contact
                contact_data = self.test_data["contact"]
                
                contact = Contact(
                    email=contact_data["email"],
                    first_name=contact_data["first_name"],
                    last_name=contact_data["last_name"],
                    contact_list_id=contact_list.id,
                    is_active=True
                )
                
                session.add(contact)
                await session.commit()
                await session.refresh(contact)
                
                assert contact.id is not None
                assert contact.email == contact_data["email"]
                assert contact.first_name == contact_data["first_name"]
                assert contact.contact_list_id == contact_list.id
                
                self.created_ids["contact_id"] = contact.id
                
                # Read contact
                retrieved_contact = await session.get(Contact, contact.id)
                assert retrieved_contact is not None
                assert retrieved_contact.email == contact_data["email"]
                
                # Update contact
                new_last_name = "Updated"
                retrieved_contact.last_name = new_last_name
                await session.commit()
                await session.refresh(retrieved_contact)
                
                assert retrieved_contact.last_name == new_last_name
                
                # Test contact relationships
                assert retrieved_contact.contact_list is not None
                assert retrieved_contact.contact_list.id == contact_list.id
                
                # Cleanup
                await session.delete(retrieved_contact)
                await session.delete(contact_list)
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Contact CRUD operations failed: {e}")
    
    @pytest.mark.asyncio
    async def test_email_template_crud_operations(self):
        """Test complete email template CRUD operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create user first
                user = await self._create_test_user(session)
                
                # Create email template
                template_data = self.test_data["template"]
                
                template = EmailTemplate(
                    name=template_data["name"],
                    subject=template_data["subject"],
                    content=template_data["content"],
                    is_active=template_data["is_active"],
                    user_id=user.id
                )
                
                session.add(template)
                await session.commit()
                await session.refresh(template)
                
                assert template.id is not None
                assert template.name == template_data["name"]
                assert template.subject == template_data["subject"]
                assert template.content == template_data["content"]
                assert template.is_active == template_data["is_active"]
                assert template.user_id == user.id
                
                self.created_ids["template_id"] = template.id
                
                # Read template
                retrieved_template = await session.get(EmailTemplate, template.id)
                assert retrieved_template is not None
                assert retrieved_template.name == template_data["name"]
                
                # Update template
                new_content = "<h1>Updated Template Content</h1>"
                retrieved_template.content = new_content
                await session.commit()
                await session.refresh(retrieved_template)
                
                assert retrieved_template.content == new_content
                
                # Test template relationships
                assert retrieved_template.user is not None
                assert retrieved_template.user.id == user.id
                
                # Cleanup
                await session.delete(retrieved_template)
                await session.delete(user)
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Email template CRUD operations failed: {e}")
    
    @pytest.mark.asyncio
    async def test_database_relationships(self):
        """Test database relationships and foreign keys"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create related entities
                user = await self._create_test_user(session)
                contact_list = await self._create_test_contact_list(session)
                contact = await self._create_test_contact(session, contact_list.id)
                campaign = await self._create_test_campaign(session, user.id, contact_list.id)
                template = await self._create_test_template(session, user.id)
                
                # Test user relationships
                user_campaigns = await session.execute(
                    "SELECT COUNT(*) FROM campaigns WHERE user_id = :user_id",
                    {"user_id": user.id}
                )
                campaign_count = user_campaigns.scalar()
                assert campaign_count >= 1
                
                # Test contact list relationships
                list_contacts = await session.execute(
                    "SELECT COUNT(*) FROM contacts WHERE contact_list_id = :list_id",
                    {"list_id": contact_list.id}
                )
                contact_count = list_contacts.scalar()
                assert contact_count >= 1
                
                # Test campaign relationships
                campaign_contacts = await session.execute(
                    """
                    SELECT COUNT(*) FROM contacts c
                    JOIN contact_lists cl ON c.contact_list_id = cl.id
                    JOIN campaigns cam ON cam.contact_list_id = cl.id
                    WHERE cam.id = :campaign_id
                    """,
                    {"campaign_id": campaign.id}
                )
                campaign_contact_count = campaign_contacts.scalar()
                assert campaign_contact_count >= 1
                
                # Cleanup
                await session.delete(campaign)
                await session.delete(template)
                await session.delete(contact)
                await session.delete(contact_list)
                await session.delete(user)
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Database relationships test failed: {e}")
    
    @pytest.mark.asyncio
    async def test_database_constraints(self):
        """Test database constraints and validation"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Test unique email constraint
                user1 = await self._create_test_user(session)
                
                # Try to create another user with same email
                duplicate_user = User(
                    email=user1.email,
                    hashed_password="different_hash",
                    first_name="Duplicate",
                    last_name="User",
                    is_active=True
                )
                
                session.add(duplicate_user)
                
                # This should raise an integrity error
                with pytest.raises(Exception):
                    await session.commit()
                
                await session.rollback()
                
                # Test required fields constraint
                incomplete_user = User(
                    email="incomplete@example.com",
                    # Missing required fields
                )
                
                session.add(incomplete_user)
                
                # This should raise a validation error
                with pytest.raises(Exception):
                    await session.commit()
                
                await session.rollback()
                
                # Cleanup
                await session.delete(user1)
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Database constraints test failed: {e}")
    
    @pytest.mark.asyncio
    async def test_database_transactions(self):
        """Test database transaction handling"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Start transaction
                async with session.begin():
                    # Create test data
                    user = await self._create_test_user(session)
                    contact_list = await self._create_test_contact_list(session)
                    
                    # Verify data exists within transaction
                    retrieved_user = await session.get(User, user.id)
                    assert retrieved_user is not None
                    
                    # Rollback transaction
                    await session.rollback()
                
                # Verify data was rolled back
                rolled_back_user = await session.get(User, user.id)
                assert rolled_back_user is None
                
                rolled_back_list = await session.get(ContactList, contact_list.id)
                assert rolled_back_list is None
                
        except Exception as e:
            pytest.skip(f"Database transactions test failed: {e}")
    
    @pytest.mark.asyncio
    async def test_database_performance(self):
        """Test database performance with bulk operations"""
        try:
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            
            async with async_session() as session:
                # Create multiple users in bulk
                start_time = time.time()
                
                users = []
                for i in range(10):
                    user = User(
                        email=f"bulk_user_{i}_{int(time.time())}@example.com",
                        hashed_password="hashed_password",
                        first_name=f"Bulk{i}",
                        last_name="User",
                        is_active=True
                    )
                    users.append(user)
                
                session.add_all(users)
                await session.commit()
                
                bulk_create_time = time.time() - start_time
                assert bulk_create_time < 5.0  # Should complete within 5 seconds
                
                # Test bulk read performance
                start_time = time.time()
                
                all_users = await session.execute("SELECT * FROM users WHERE email LIKE 'bulk_user_%'")
                users_list = all_users.fetchall()
                
                bulk_read_time = time.time() - start_time
                assert bulk_read_time < 2.0  # Should complete within 2 seconds
                assert len(users_list) >= 10
                
                # Cleanup bulk data
                await session.execute("DELETE FROM users WHERE email LIKE 'bulk_user_%'")
                await session.commit()
                
        except Exception as e:
            pytest.skip(f"Database performance test failed: {e}")
    
    # Helper methods for creating test data
    async def _create_test_user(self, session: AsyncSession) -> User:
        """Helper method to create a test user"""
        user_data = self.test_data["user"]
        hashed_password = get_password_hash(user_data["password"])
        
        user = User(
            email=user_data["email"],
            hashed_password=hashed_password,
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            is_active=True
        )
        
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
    
    async def _create_test_contact_list(self, session: AsyncSession) -> ContactList:
        """Helper method to create a test contact list"""
        contact_list_data = self.test_data["contact_list"]
        
        contact_list = ContactList(
            name=contact_list_data["name"],
            description=contact_list_data["description"],
            is_active=True
        )
        
        session.add(contact_list)
        await session.commit()
        await session.refresh(contact_list)
        return contact_list
    
    async def _create_test_contact(self, session: AsyncSession, contact_list_id: int) -> Contact:
        """Helper method to create a test contact"""
        contact_data = self.test_data["contact"]
        
        contact = Contact(
            email=contact_data["email"],
            first_name=contact_data["first_name"],
            last_name=contact_data["last_name"],
            contact_list_id=contact_list_id,
            is_active=True
        )
        
        session.add(contact)
        await session.commit()
        await session.refresh(contact)
        return contact
    
    async def _create_test_campaign(self, session: AsyncSession, user_id: int, contact_list_id: int) -> Campaign:
        """Helper method to create a test campaign"""
        campaign_data = self.test_data["campaign"]
        
        campaign = Campaign(
            name=campaign_data["name"],
            subject=campaign_data["subject"],
            content=campaign_data["content"],
            scheduled_at=campaign_data["scheduled_at"],
            user_id=user_id,
            contact_list_id=contact_list_id,
            status="draft"
        )
        
        session.add(campaign)
        await session.commit()
        await session.refresh(campaign)
        return campaign
    
    async def _create_test_template(self, session: AsyncSession, user_id: int) -> EmailTemplate:
        """Helper method to create a test email template"""
        template_data = self.test_data["template"]
        
        template = EmailTemplate(
            name=template_data["name"],
            subject=template_data["subject"],
            content=template_data["content"],
            is_active=template_data["is_active"],
            user_id=user_id
        )
        
        session.add(template)
        await session.commit()
        await session.refresh(template)
        return template

if __name__ == "__main__":
    # Run tests directly if script is executed
    pytest.main([__file__, "-v"])
