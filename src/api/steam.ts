import axios from 'axios';
import { SteamGame } from '../types';
import dotenv from 'dotenv';

dotenv.config();

class SteamAPI {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.STEAM_API_KEY || '';
        this.baseUrl = 'https://api.steampowered.com';
    }

    async getSteamId(vanityUrl: string): Promise<string> {
        try {
            const response = await axios.get(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`, {
                params: {
                    key: this.apiKey,
                    vanityurl: vanityUrl
                }
            });
            return response.data.response.steamid;
        } catch (error) {
            console.error('Error getting Steam ID:', (error as Error).message);
            throw error;
        }
    }

    async getOwnedGames(steamId: string): Promise<SteamGame[]> {
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
            console.error('Error getting owned games:', (error as Error).message);
            throw error;
        }
    }
}

export default new SteamAPI(); 