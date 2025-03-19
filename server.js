// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Variables pour stocker le token
let spotifyToken = null;
let tokenExpiration = 0;

console.log("Variables d'environnement chargées :");
console.log("SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID ? "Défini" : "Non défini");
console.log("SPOTIFY_CLIENT_SECRET:", process.env.SPOTIFY_CLIENT_SECRET ? "Défini" : "Non défini");
console.log("PORT:", process.env.PORT);

// Fonction pour obtenir un token
async function getSpotifyToken() {
    const now = Date.now();
    
    console.log("Tentative d'obtention d'un token Spotify");
    console.log(`ID Client disponible: ${!!process.env.SPOTIFY_CLIENT_ID}`);
    console.log(`Secret Client disponible: ${!!process.env.SPOTIFY_CLIENT_SECRET}`);
    
    // Si le token est valide, le renvoyer
    if (spotifyToken && tokenExpiration > now) {
        console.log("Utilisation d'un token existant valide");
        return spotifyToken;
    }
    
    // Sinon, demander un nouveau token
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        console.log("Envoi de la requête d'authentification à Spotify");
        
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: {
                grant_type: 'client_credentials'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            }
        });
        
        console.log("Réponse d'authentification reçue:", response.status);
        
        spotifyToken = response.data.access_token;
        tokenExpiration = now + (response.data.expires_in * 1000);
        
        return spotifyToken;
    } catch (error) {
        console.error('Erreur d\'authentification Spotify détaillée:', error);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }
        throw error;
    }
}

// Endpoint pour récupérer une playlist Spotify
app.get('/api/spotify/playlist/:id', async (req, res) => {
    try {
        const playlistId = req.params.id;
        console.log(`Tentative de récupération de la playlist ${playlistId}`);
        
        // Vérifiez si les identifiants existent
        if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
            console.error("Identifiants Spotify manquants dans les variables d'environnement");
            return res.status(500).json({ error: "Configuration Spotify manquante" });
        }
        
        const token = await getSpotifyToken();
        console.log("Token obtenu avec succès");
        
        console.log(`Envoi de la requête à l'API Spotify pour la playlist ${playlistId}`);
        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/playlists/${playlistId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log("Réponse reçue de l'API Spotify");
        
        if (!response.data.tracks || !response.data.tracks.items) {
            console.error("Format de réponse inattendu:", JSON.stringify(response.data).substring(0, 200));
            return res.status(500).json({ error: "Format de réponse Spotify inattendu" });
        }
        
        // Traitement des données...
        const tracks = response.data.tracks.items.map(item => {
            const track = item.track;
            return {
                title: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                duration: msToMinSec(track.duration_ms)
            };
        });
        
        res.json(tracks);
    } catch (error) {
        console.error('Erreur lors de la récupération de la playlist:', error);
        
        if (error.response) {
            console.error('Détails de la réponse d\'erreur:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data).substring(0, 500));
        } else if (error.request) {
            console.error('Aucune réponse reçue:', error.request);
        } else {
            console.error('Erreur de configuration de la requête:', error.message);
        }
        
        res.status(500).json({ error: 'Erreur lors de la récupération de la playlist', details: error.message });
    }
});

// Fonction utilitaire pour convertir les millisecondes en format min:sec
function msToMinSec(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});