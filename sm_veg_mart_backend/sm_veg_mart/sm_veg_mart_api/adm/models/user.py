from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.db import models
from .role import Role
from datetime import datetime,date
from rest_framework.exceptions import APIException
from django.utils.crypto import get_random_string

class UserManager(BaseUserManager):
    def create_user(self, email=None, password=None, mobile=None, username=None, **extra_fields):
        """Create and return a `User` with email and mobile (no username)."""
        # Fallback if email was passed as username argument or vice-versa
        target_email = email or username
        if not target_email:
            raise TypeError('Users must have an email address.')

        normalized_email = self.normalize_email(target_email)
        user = self.model(email=normalized_email, mobile=mobile, **extra_fields)
        user.is_active = extra_fields.get('is_active', True)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, password=None, mobile=None, username=None, **extra_fields):
        target_email = email or username
        if not target_email:
            raise TypeError('Superusers must have an email address.')
        if not password:
            raise TypeError('Superusers must have a password.')

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        user = self.create_user(email=target_email, password=password, mobile=mobile, **extra_fields)
        return user
    
    
    def normalize_username(self,username):
        #logger.info("lower",username.strip().lower())
        return username.strip().lower()
    
    def make_random_password(self, length=10):
        """Generate a random password."""
        return get_random_string(length)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(db_index=True, unique=True,null=True,blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    mobile = models.CharField(max_length=25,null=True)
    # role = models.ManyToManyField(Role,related_name="users")
    validate_token = models.CharField(max_length=20, blank=True, null=True)
    profile_completed=models.BooleanField(default=False)
    is_verified=models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    joining_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # More fields required by Django when specifying a custom user model.

    # The `USERNAME_FIELD` property tells us which field we will use to log in.
    # In this case we want it to be the email field.
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['mobile']

    # Tells Django that the UserManager class defined above should manage
    # objects of this type.
    objects = UserManager()

    def get_perms(self):
     
        perms_list = []
        ##logger.info("User name: " + self.username)
        ##logger.info("Roles List: " + str(self.roles))
        for r in self.roles.all():
            ##logger.info(r)
            
            perms_list = perms_list + list(r.perms.all().values_list("name", flat=True))
           
      
        ##logger.info("Perms List: " + str(perms_list))
        return perms_list
        
    def get_users(self):
        users = User.objects.all()
        users_list = []
        #for u in self.username.all():
            #users_list = users_list + list(u.values_list("name",flat=True))

        for user in users:
                users_list.append(user.mobile)

        ##logger.info(users_list)

        return users_list