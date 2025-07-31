from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

class MediaStorage(S3Boto3Storage):
    bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'default-bucket')
    custom_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
    default_acl = 'public-read'
    querystring_auth = False
    file_overwrite = False
    
    def _save(self, name, content):
        if name.startswith('/'):
            name = name[1:]
        return super()._save(name, content)