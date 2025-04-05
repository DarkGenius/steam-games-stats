const axios = require('axios');
require('dotenv').config();

class SteamAPI {
    constructor() {
        this.apiKey = process.env.STEAM_API_KEY;
        this.baseUrl = 'https://api.steampowered.com';
    }

    async getSteamId(vanityUrl) {
        try {
            const response = await axios.get(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`, {
                params: {
                    key: this.apiKey,
                    vanityurl: vanityUrl
                }
            });
            return response.data.response.steamid;
        } catch (error) {
            console.error('Error getting Steam ID:', error.message);
            throw error;
        }
    }

    async getOwnedGames(steamId) {
        try {
            const response = await axios.get(`${this.baseUrl}/IPlayerService/GetOwnedGames/v1/`, {
                params: {
                    key: this.apiKey,
                    steamid: steamId,
                    include_appinfo: 1,
                    include_played_free_games: 1
                }
            });
            return response.data.response.games || [];
        } catch (error) {
            console.error('Error getting owned games:', error.message);
            throw error;
        }
    }
}

module.exports = new SteamAPI(); 