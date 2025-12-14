from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from conduit.apps.profiles.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create missing profiles for existing users'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(profile__isnull=True)
        created_count = 0
        
        for user in users_without_profile:
            profile, created = Profile.objects.get_or_create(user=user)
            if created:
                created_count += 1
                self.stdout.write(f'Created profile for user: {user.email}')
        
        if created_count == 0:
            self.stdout.write(
                self.style.SUCCESS('All users already have profiles!')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} profiles')
            )