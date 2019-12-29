import React from 'react';
import { createRuleTopStyles, createDimTopBottomStyles } from '../../utils/selectionStyles';

interface SelectionRulesTopProps {
  selectionOrigin: any;
  hoverOrigin: any;
  artboardFrame: any;
  inset?: any;
}

class SelectionRulesTop extends React.Component<SelectionRulesTopProps, {}> {
  render() {
    const { selectionOrigin, hoverOrigin, artboardFrame, inset } = this.props;
    return (
      <div
        className='c-selection__rule c-selection__rule--t'
        style={createRuleTopStyles(selectionOrigin, hoverOrigin, inset)}>
        <div
          className='c-selection__dim'
          style={createDimTopBottomStyles(selectionOrigin, artboardFrame)}>
          {
            selectionOrigin.top <= hoverOrigin.bottom
            ? `${selectionOrigin.top - hoverOrigin.top}px`
            : `${selectionOrigin.top - hoverOrigin.bottom}px`
          }
        </div>
      </div>
    );
  }
}

export default SelectionRulesTop;
