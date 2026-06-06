import { api } from "./client";

interface createSessionRequest {
    song_id: number,
    mode: string,
    partner_recording_id?: number,
}

interface createSessionResponse {
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

export const createSession = async (data : createSessionRequest) : Promise<createSessionResponse> => {
    const response = await api.post('/sessions', data);
    console.log(response);
    return response.data;
}

// 세션 중도 종료
export const abortSession = async (session_id : number) => {
    console.log(`session id: ${session_id}`)
    const response = await api.post(`/sessions/${session_id}/abort`);
    console.log(response);
    return response.data;
}

export const getPreviousMarking = async (session_id:number) => {
    console.log(`session id: ${session_id}`);
    const response = await api.get(`/sessions/${session_id}/previous-markings`);
    console.log(response);
    return response.data;
}

export const completeSession = async (session_id: number) => {
  console.log(`complete session id: ${session_id}`);

  const response = await api.post(
    `/sessions/${session_id}/complete`
  );

  console.log(response);
  return response.data;
};