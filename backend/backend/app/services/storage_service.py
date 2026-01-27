import uuid
from typing import Optional

from app.core.config import settings


class StorageService:
    """
    Service for managing file uploads to S3/MinIO.
    Uses boto3 for AWS S3 and S3-compatible storage (MinIO).
    """

    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
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
        """Create bucket if it doesn't exist."""
        from botocore.exceptions import ClientError  # noqa: TCH002 - Third-party import

        try:
            self._s3_client.head_bucket(Bucket=self.BUCKET_NAME)
        except ClientError:
            self._s3_client.create_bucket(Bucket=self.BUCKET_NAME)

    def validate_file(self, filename: str, content_type: str, file_size: int) -> None:
        """Validate file before upload."""
        if content_type not in self.ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Invalid file type: {content_type}. "
                f"Allowed: {', '.join(self.ALLOWED_MIME_TYPES)}"
            )

        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(
                f"File too large: {file_size} bytes. " f"Max size: {self.MAX_FILE_SIZE} bytes (5MB)"
            )

    def generate_object_key(self, card_id: str, side: str, original_filename: str) -> str:
        """Generate unique object key for uploaded file."""
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "jpg"
        unique_id = str(uuid.uuid4())
        return f"cards/{card_id[:8]}/{card_id}_{side}_{unique_id}.{ext}"

    def upload_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        card_id: str,
        side: str,
    ) -> str:
        """
        Upload file to storage and return public URL.

        Args:
            file_data: File bytes
            filename: Original filename
            content_type: MIME type
            card_id: Card UUID for organization
            side: Either 'question' or 'answer'

        Returns:
            Public URL of the uploaded file
        """
        self._ensure_bucket_exists()

        file_size = len(file_data)
        self.validate_file(filename, content_type, file_size)

        object_key = self.generate_object_key(card_id, side, filename)

        self._s3_client.put_object(
            Bucket=self.BUCKET_NAME,
            Key=object_key,
            Body=file_data,
            ContentType=content_type,
        )

        # Return public URL (will be proxied through nginx)
        return f"/images/{object_key}"

    def delete_file(self, object_url: Optional[str]) -> None:
        """
        Delete file from storage.

        Args:
            object_url: Full URL like "/images/cards/abc123/..." or None
        """
        if not object_url:
            return

        # object_url comes from DB as "/images/cards/..."
        # Need to strip the "/images/" prefix
        storage_key = object_url.replace("/images/", "", 1)

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
