import { writable } from 'svelte/store'
import type { Options } from '../types';

export const state = writable<Options | null>(null);