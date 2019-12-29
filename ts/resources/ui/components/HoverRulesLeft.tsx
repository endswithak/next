import React from 'react';
import { createRuleLeftStyles } from '../../utils/hoverStyles';

interface HoverRulesLeftProps {
  hoverOrigin: any;
  selectionOrigin: any;
}

class HoverRulesLeft extends React.Component<HoverRulesLeftProps, {}> {
  render() {
    const { hoverOrigin, selectionOrigin } = this.props;
    return (
      <div>
        {
          selectionOrigin.bottom < hoverOrigin.top
          || selectionOrigin.top <= hoverOrigin.bottom && selectionOrigin.top > hoverOrigin.top
          || selectionOrigin.top < hoverOrigin.top && selectionOrigin.bottom > hoverOrigin.bottom
          ? <div
              className='c-hover__rule c-hover__rule--lt'
              style={createRuleLeftStyles(hoverOrigin, selectionOrigin)} />
          : null
        }
        {
          selectionOrigin.top > hoverOrigin.bottom
          || selectionOrigin.bottom >= hoverOrigin.top && selectionOrigin.bottom < hoverOrigin.bottom
          || selectionOrigin.bottom > hoverOrigin.bottom && selectionOrigin.top < hoverOrigin.top
          ? <div
              className='c-hover__rule c-hover__rule--lb'
              style={createRuleLeftStyles(hoverOrigin, selectionOrigin)} />
          : null
        }
      </div>
    );
  }
}

export default HoverRulesLeft;