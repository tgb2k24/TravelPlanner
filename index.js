import 'react-native-get-random-values';
import { TextDecoder, TextEncoder } from 'text-encoding';
import 'url-polyfill';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { AppRegistry } from 'react-native';
import App from './App';
import { expo } from './app.json';

AppRegistry.registerComponent(expo.name, () => App);

