import ReactDOM from 'react-dom/client';
import { App } from './App';

const container = document.querySelector('#app');

export async function bootstrap() {
  if (!container) {
    throw new Error('Container #app does not exist');
  }

  if (process.env.NODE_ENV === 'development') {
    const { ethers } = await import('ethers');
    function number(obj: any) {
      if (obj.eq(ethers.constants.MaxUint256)) {
        return 'MaxUint256';
      }
      if (obj.eq(ethers.constants.MaxInt256)) {
        return 'MaxInt256';
      }
      if (obj.abs().gt(1e10)) {
        // Assuming everything bigger than 1e10 is a wei
        return `wei ${parseFloat(ethers.utils.formatEther(`${obj}`))}`;
      }
      return parseFloat(obj.toString());
    }

    // @ts-ignore
    window.devtoolsFormatters = window.devtoolsFormatters ?? [];
    // @ts-ignore
    window.devtoolsFormatters.push({
      header: function (obj: any) {
        if (obj instanceof ethers.BigNumber) {
          return [
            'div',
            { style: 'color: #f33' },
            ['span', {}, 'BigNumber('],
            ['span', { style: 'color: #ff3' }, number(obj)],
            ['span', {}, ' '],
            ['span', { style: 'color: #3f3' }, obj.toHexString()],
            ['span', {}, ')'],
          ];
        }
        return null;
      },
      hasBody: function () {
        return false;
      },
    });
  }

  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
