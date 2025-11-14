#!/bin/bash
# Create upload directories
mkdir -p /var/app/current/uploads/arModels
mkdir -p /var/app/current/uploads/facades
mkdir -p /var/app/current/uploads/media
mkdir -p /var/app/current/uploads/profile
mkdir -p /var/app/current/uploads/emergency
mkdir -p /var/app/current/uploads/photobooth
mkdir -p /var/app/current/uploads/itineraries
mkdir -p /var/app/current/uploads/userItineraries
mkdir -p /var/app/current/uploads/reviews

# Set permissions
chmod -R 777 /var/app/current/uploads
