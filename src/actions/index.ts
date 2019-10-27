// Packages
import { combineReducers } from 'redux';

// Ours
export * from './constants';
import queries from './queries';

const reducer = combineReducers({ queries });
export type RootState = ReturnType<typeof reducer>;

export default reducer;
