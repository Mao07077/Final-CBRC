from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Use your actual credentials file name
CREDENTIALS_FILE = 'client_secret.json'


def authenticate():
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    creds = flow.run_local_server(port=8080)
    return creds


def upload_pdf(file_path, creds):
    service = build('drive', 'v3', credentials=creds)
    file_metadata = {'name': os.path.basename(file_path)}
    media = MediaFileUpload(file_path, mimetype='application/pdf')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    # Make file public
    service.permissions().create(fileId=file['id'], body={'role': 'reader', 'type': 'anyone'}).execute()
    # Get public link
    link = f"https://drive.google.com/file/d/{file['id']}/view?usp=sharing"
    return link


if __name__ == '__main__':
    creds = authenticate()
    # Use the actual PDF filename and path
    public_link = upload_pdf('uploads/ODB MATH PROFICIENCY.pdf', creds)
    print('Public link:', public_link)
