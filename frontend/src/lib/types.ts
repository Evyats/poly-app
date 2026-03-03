export type Exercise = {
  id: string;
  name: string;
  reps: number;
  step: number;
};

export type RepsTab = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type RepsState = {
  tabs: RepsTab[];
};

export type WakeupEntry = {
  date: string;
  time: string;
};

export type WeightEntry = {
  date: string;
  weight: number;
};

export type RoutineTask = {
  id: string;
  label: string;
  isTimed: boolean;
  initialSeconds: number;
  remainingSeconds: number;
  completed: boolean;
};

export type RoutineState = {
  date: string;
  studySeconds: number;
  tasks: RoutineTask[];
};

export type AuthUser = {
  id: number;
  email: string | null;
  username: string;
};
