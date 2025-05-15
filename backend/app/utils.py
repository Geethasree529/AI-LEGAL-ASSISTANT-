
import os
import time

import google.generativeai as genai
# /media/uploads/resumedraft.pdf
genai.configure(api_key='AIzaSyDBP8i-K_pmk-1mi168uwTFD1VnlsLzSSg')
def prompt(file,message="Analyse the given pdf",history=[]):
    def upload_to_gemini(path, mime_type=None):
        file = genai.upload_file(path, mime_type=mime_type)
        print(f"Uploaded file '{file.display_name}' as: {file.uri}")
        return file
    def wait_for_files_active(files):
        for name in (file.name for file in files):
            file = genai.get_file(name)
            while file.state.name == "PROCESSING":
                print(".", end="", flush=True)
                time.sleep(10)
                file = genai.get_file(name)
            if file.state.name != "ACTIVE":
                raise Exception(f"File {file.name} failed to process")
        print("...all files ready")
        print()
    generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
    }
    model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    )
    # TODO Make these files available on the local file system
    # You may need to update the file paths
    current_directory = os.path.dirname(os.path.abspath(__file__))
    backend_directory = os.path.dirname(current_directory)
    file = backend_directory+file
    files = [
    upload_to_gemini(file, mime_type="application/pdf"),
    ]
    # Some files have a processing delay. Wait for them to be ready.
    wait_for_files_active(files)
    history=[
            {
                "role": "user",
                "parts": [
                    files[0],
                ],
            },
        ]
    history=history+history
    chat_session = model.start_chat(
        history=history
    )
    response = chat_session.send_message(message)
    return response.text
