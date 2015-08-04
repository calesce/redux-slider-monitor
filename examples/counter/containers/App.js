import React, { Component } from 'react';
import CounterApp from './CounterApp';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { devTools, persistState } from 'redux-devtools';
import { DevTools, DebugPanel } from 'redux-devtools/lib/react';
import SliderMonitor from 'redux-slider-monitor';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import * as reducers from '../reducers';

const finalCreateStore = compose(
  applyMiddleware(thunk),
  devTools(),
  persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/)),
  createStore
);

const reducer = combineReducers(reducers);
const store = finalCreateStore(reducer);

export default class App extends Component {
  render() {
    return (
      <div>
        <Provider store={store}>
          {() => <CounterApp />}
        </Provider>
        <DebugPanel left right bottom>
          <DevTools store={store}
                    keyboardEnabled
                    monitor={SliderMonitor} />
        </DebugPanel>
      </div>
    );
  }
}
