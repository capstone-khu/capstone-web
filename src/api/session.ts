import { api } from "./client";

interface createRequest {
    song_id: number,
    mode: string,
    partner_recording_id?: number,
}

interface createResponse {
    "success":boolean,
    "status":number,
    "message":string,
    "code"?:string,
    "meta"?:string,
    "data": {
        "session_id":number,
        "status":string,
        "song_title":string,
        "partner_name"?:string,
        "audio_url"?:string,
    }
}

export const createSession = async (data:createRequest):Promise<createResponse> => {
    const response = await api.post('/sessions', data);
    console.log(response);
    return response.data;
}

export const abortSession = async (session_id:number) => {
    console.log(`session id: ${session_id}`)
    const response = await api.post(`/sessions/${session_id}/abort`);
    console.log(response);
    return response.data;
}