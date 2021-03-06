import {Transform} from 'vega-dataflow';
import {inherits, falsy} from 'vega-util';

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
export default function Encode(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Encode, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encode = pulse.encode,
      reenter = encode === 'enter',
      update = _.encoders.update || falsy,
      enter = _.encoders.enter || falsy,
      exit = _.encoders.exit || falsy,
      set = (encode && !reenter ? _.encoders[encode] : update) || falsy;

  if (pulse.changed(pulse.ADD)) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _);
      update(t, _);
      if (set !== falsy && set !== update) set(t, _);
    });
    out.modifies(enter.output);
    out.modifies(update.output);
    if (set !== falsy && set !== update) out.modifies(set.output);
  }

  if (pulse.changed(pulse.REM) && exit !== falsy) {
    pulse.visit(pulse.REM, function(t) { exit(t, _); });
    out.modifies(exit.output);
  }

  if (reenter || set !== falsy) {
    var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
    if (reenter) {
      pulse.visit(flag, function(t) {
        var mod = enter(t, _);
        if (set(t, _) || mod) out.mod.push(t);
      });
      if (out.mod.length) out.modifies(enter.output);
    } else {
      pulse.visit(flag, function(t) {
        if (set(t, _)) out.mod.push(t);
      });
    }
    if (out.mod.length) out.modifies(set.output);
  }

  return out;
};
