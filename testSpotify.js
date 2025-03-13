const axios = require('axios');
const clientId = "df9927123783400382c9547d2a90771f";
const clientSecret = "26cd20fcc3c14798888eec234afd4889";

async function testSpotifyAuth() {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: { grant_type: 'client_credentials' },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            }
        });
        console.log("Token Spotify obtingut:", response.data.access_token);
    } catch (error) {
        console.error("Error d'autenticació:", error.response ? error.response.data : error.message);
    }
}
testSpotifyAuth();