export interface CreateSessionDto {
  title: string;
  description: string;
}

export interface AddSceneDto {
  title: string;
  content: string;
  choices: string[];
}

export interface CastVoteDto {
  sceneId: string;
  choiceId: string;
}
