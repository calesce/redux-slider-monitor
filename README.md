A custom monitor for use with [Redux DevTools](https://github.com/gaearon/redux-devtools).

It uses a slider based on [react-slider](https://github.com/mpowaga/react-slider) to slide between different recorded actions. It also features play/pause/step-through, which is inspired by some very cool [Elm](http://elm-lang.org/) [examples](http://elm-lang.org/blog/time-travel-made-easy).

<image src="https://s3.amazonaws.com/f.cl.ly/items/2i1L1G1n1a1h3y1a2O1w/Screen%20Recording%202015-08-04%20at%2007.45%20PM.gif" width='600'>

### Installation

```npm install redux-slider-monitor```

In your root component:
```javascript
import { DevTools, DebugPanel } from 'redux-devtools';
import SliderMonitor from 'redux-slider-monitor';

<DebugPanel left right bottom>
  <DevTools store={store}
            keyboardEnabled // this is optional
            realtime // optional, try out replaying your actions with the same time intervals in which they were dispatched!
            monitor={SliderMonitor}
  />
</DebugPanel>

```

### Usage

Fire off some Redux actions. Use the slider to navigate between the state changes.

Click the play/pause buttons (or spacebar) to watch the state changes over time, or step backward or forward in state time with the left/right arrow buttons (or keys).

### Running Examples

You can do this:

```
git clone https://github.com/calesce/redux-slider-monitor.git
cd redux-slider-monitor
npm install

cd examples/counter
npm install
npm start
open http://localhost:3000
```


### License

MIT
