from datetime import datetime, timezone
from sqlmodel import Session, select, delete
from app.database import engine
from app.models import GroupInvitation

def cleanup_expired_invitations():
    """
    Deletes group invitations that are expired or have been accepted.
    This function is designed to be run as a scheduled job.
    """
    print("SCHEDULER: Running cleanup job for expired invitations...")
    try:
        with Session(engine) as session:
            now = datetime.now(timezone.utc)
            
            # Define the criteria for deletion
            statement = delete(GroupInvitation).where(
                (GroupInvitation.status == "accepted") | (GroupInvitation.expires_at < now)
            )
            
            result = session.exec(statement)
            session.commit()
            
            if result.rowcount > 0:
                print(f"SCHEDULER: Successfully cleaned up {result.rowcount} invitations.")
            else:
                print("SCHEDULER: No expired or used invitations to clean up.")

    except Exception as e:
        print(f"SCHEDULER: Error during cleanup job: {e}")
