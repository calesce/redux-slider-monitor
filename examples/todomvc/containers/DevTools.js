import React from 'react';
import { createDevTools } from 'redux-devtools';
import DockMonitor from 'redux-devtools-dock-monitor';
import SliderMonitor from 'redux-slider-monitor';

export default createDevTools(
  <DockMonitor toggleVisibilityKey='H'
               changePositionKey='Q'
               defaultPosition='bottom'
               defaultSize={0.30}>
    <SliderMonitor keyboardEnabled />
  </DockMonitor>
);
