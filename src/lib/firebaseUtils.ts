import { auth } from './firebase';
import { where, query, CollectionReference, Query } from 'firebase/firestore';

export function getOwnerId(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User must be logged in to perform this action');
  }
  return uid;
}

export function withOwner(ref: CollectionReference | Query) {
  return query(ref, where('ownerId', '==', getOwnerId()));
}

export function addOwner<T extends object>(data: T): T & { ownerId: string } {
  return {
    ...data,
    ownerId: getOwnerId()
  };
}
