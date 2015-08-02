A custom monitor for use with [Redux DevTools](https://github.com/gaearon/redux-devtools).

It uses a slider based on [react-slider](https://github.com/mpowaga/react-slider) to slide between different recorded actions. It also features play/pause/step-through, which is inspired by some very cool [Elm](http://elm-lang.org/) [examples](http://elm-lang.org/blog/time-travel-made-easy).

### Installation

```npm install redux-slider-monitor```

In your root component:
```
import { DevTools, DebugPanel } from 'redux-devtools';
import SliderMonitor from 'redux-slider-monitor';

<DebugPanel left right bottom>
  <DevTools store={store}
            monitor={SliderMonitor}
  />
</DebugPanel>

```

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
