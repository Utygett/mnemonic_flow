import uuid
from enum import Enum
from typing import Literal, Optional

from app.core.config import settings


class FileType(Enum):
    """File type for validation."""

    IMAGE = "image"
    AUDIO = "audio"


class StorageService:
    """
    Service for managing file uploads to S3/MinIO.
    Uses boto3 for AWS S3 and S3-compatible storage (MinIO).
    """

    # Image settings
    IMAGE_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
    IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    # Audio settings
    AUDIO_ALLOWED_MIME_TYPES = {
        "audio/mpeg",  # mp3
        "audio/mp4",  # m4a
        "audio/wav",
        "audio/webm",
        "audio/ogg",  # opus
    }
    AUDIO_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB for audio

    BUCKET_NAME = settings.MINIO_BUCKET_NAME

    def __init__(self) -> None:
        # Lazy import boto3 only when actually creating a StorageService instance
        import boto3  # noqa: TCH002 - Third-party import needed for S3

        # MINIO_ENDPOINT may already include protocol (http:// or https://)
        endpoint = settings.MINIO_ENDPOINT
        if not endpoint.startswith(("http://", "https://")):
            protocol = "https" if settings.MINIO_USE_SSL else "http"
            endpoint_url = f"{protocol}://{endpoint}"
        else:
            endpoint_url = endpoint

        self._s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name="us-east-1",
        )

    def _ensure_bucket_exists(self) -> None:
        """Create bucket if it doesn't exist and set public read policy."""
        import json

        from botocore.exceptions import ClientError  # noqa: TCH002 - Third-party import

        try:
            self._s3_client.head_bucket(Bucket=self.BUCKET_NAME)
        except ClientError:
            self._s3_client.create_bucket(Bucket=self.BUCKET_NAME)
            # Set bucket policy for public read access
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": {"AWS": "*"},
                        "Action": "s3:GetObject",
                        "Resource": f"arn:aws:s3:::{self.BUCKET_NAME}/*",
                    }
                ],
            }
            self._s3_client.put_bucket_policy(Bucket=self.BUCKET_NAME, Policy=json.dumps(policy))

    def validate_file(
        self,
        filename: str,
        content_type: str,
        file_size: int,
        file_type: Literal[FileType.IMAGE, FileType.AUDIO] = FileType.IMAGE,
    ) -> None:
        """Validate file before upload."""
        if file_type == FileType.IMAGE:
            allowed_types = self.IMAGE_ALLOWED_MIME_TYPES
            max_size = self.IMAGE_MAX_FILE_SIZE
        else:  # AUDIO
            allowed_types = self.AUDIO_ALLOWED_MIME_TYPES
            max_size = self.AUDIO_MAX_FILE_SIZE

        if content_type not in allowed_types:
            raise ValueError(
                f"Invalid file type: {content_type}. " f"Allowed: {', '.join(allowed_types)}"
            )

        if file_size > max_size:
            raise ValueError(
                f"File too large: {file_size} bytes. "
                f"Max size: {max_size} bytes ({max_size // (1024*1024)}MB)"
            )

    def generate_object_key(
        self,
        card_id: str,
        side: str,
        file_type: Literal[FileType.IMAGE, FileType.AUDIO],
        original_filename: str,
    ) -> str:
        """Generate unique object key for uploaded file."""
        ext = (
            original_filename.rsplit(".", 1)[-1].lower()
            if "." in original_filename
            else ("jpg" if file_type == FileType.IMAGE else "mp3")
        )
        unique_id = str(uuid.uuid4())
        type_prefix = "audio" if file_type == FileType.AUDIO else "cards"
        return f"{type_prefix}/{card_id[:8]}/{card_id}_{side}_{unique_id}.{ext}"

    def upload_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        card_id: str,
        side: str,
        file_type: Literal[FileType.IMAGE, FileType.AUDIO] = FileType.IMAGE,
    ) -> str:
        """
        Upload file to storage and return public URL.

        Args:
            file_data: File bytes
            filename: Original filename
            content_type: MIME type
            card_id: Card UUID for organization
            side: Either 'question' or 'answer'
            file_type: Type of file (image or audio)

        Returns:
            Public URL of the uploaded file
        """
        self._ensure_bucket_exists()

        file_size = len(file_data)
        self.validate_file(filename, content_type, file_size, file_type)

        object_key = self.generate_object_key(card_id, side, file_type, filename)

        self._s3_client.put_object(
            Bucket=self.BUCKET_NAME,
            Key=object_key,
            Body=file_data,
            ContentType=content_type,
        )

        # Return public URL (will be proxied through nginx)
        url_prefix = "/audio/" if file_type == FileType.AUDIO else "/images/"
        return f"{url_prefix}{object_key}"

    def delete_file(self, object_url: Optional[str]) -> None:
        """
        Delete file from storage.

        Args:
            object_url: Full URL like "/images/cards/abc123/..." or "/audio/..." or None
        """
        if not object_url:
            return

        # object_url comes from DB as "/images/cards/..." or "/audio/..."
        # Need to strip the prefix
        storage_key = object_url.replace("/images/", "", 1).replace("/audio/", "", 1)

        from botocore.exceptions import ClientError  # noqa: TCH002 - Third-party import

        try:
            self._s3_client.delete_object(Bucket=self.BUCKET_NAME, Key=storage_key)
        except ClientError:
            # Log but don't fail - file may already be deleted
            pass


# Singleton instance (lazy initialization)
_storage_service_instance: StorageService | None = None


def get_storage_service() -> StorageService:
    """Get or create the singleton StorageService instance."""
    global _storage_service_instance
    if _storage_service_instance is None:
        _storage_service_instance = StorageService()
    return _storage_service_instance


# For backwards compatibility, create a module-level proxy
class _StorageServiceModule:
    """Module-level proxy for backward compatibility."""

    def __getattr__(self, name: str):
        return getattr(get_storage_service(), name)


storage_service = _StorageServiceModule()
