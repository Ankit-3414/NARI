# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend /app/backend
COPY modules /app/modules
COPY data /app/data
COPY nari.py /app/nari.py
COPY nari_status.py /app/nari_status.py

# Copy the built frontend files
COPY frontend/dist /app/frontend/dist

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=nari.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

# Run the application
CMD ["python", "nari.py", "--server"]
