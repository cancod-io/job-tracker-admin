/** Face soft-MFA DTOs for `/api/v1/auth/face/*`. */

/** Exactly 128 floats from face-api FaceRecognitionNet. */
export type FaceDescriptor = number[];

export type FaceStatusResponse = {
  enrolled: boolean;
  label: string | null;
  enrolled_at: string | null;
  last_verified_at: string | null;
  face_required_on_login: boolean;
};

export type FaceEnrollRequest = {
  descriptor: FaceDescriptor;
  label?: string | null;
};

export type FaceLoginVerifyRequest = {
  face_session_id: string;
  descriptor: FaceDescriptor;
};

export const FACE_DESCRIPTOR_LENGTH = 128;
