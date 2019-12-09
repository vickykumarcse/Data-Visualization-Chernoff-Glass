class ChernoffWineGlassMap {
  svgWidth;
  svgHeight;
  wineColorIntensity = null;
  amountOfWine = null;
  sortingAttribute = null;
  sortingOrder = null;
  chernoffMapSvg = null;
  svgData = [];
  initialSvgData = [];

  constructor() {
    this.svgWidth = 1500;
    this.svgHeight = 3200;
    this.wineColorIntensity = document.getElementById('wine-color-intensity');
    this.amountOfWine = document.getElementById('amount-of-wine');
    this.iceCubeSize = document.getElementById('ice-cube-size');
    this.strawPipePosition = document.getElementById('straw-pipe-position');
    this.sortingAttribute = document.querySelector('#sorting-attribute');
    this.sortingOrder = document.querySelector('#sorting-order');
    this.sortingAttribute.addEventListener('change', () => {
      this.disableApply();
    });
    this.sortingOrder.addEventListener('change', () => {
      this.disableApply();
    });
    this.applyButton = document.getElementById('apply-button');
    this.applyButton.disabled = true;
    this.applyButton.addEventListener('click', () => {
      this.applySorting();
    });
    this.chernoffMapSvg = d3
      .select('.chernoff-map')
      .attr('width', `${this.svgWidth}px`)
      .attr('height', `${this.svgHeight}px`);
    this.loadWineDataset();
  }

  loadWineDataset() {
    d3.csv('./data/wine.data').then(result => {
      this.fillAttributeDropdown(result.columns);
      const formattedData = this.formatData(result);
      this.svgData = this.computeTranslatePosition(formattedData);
      this.initialSvgData = JSON.parse(JSON.stringify(this.svgData));
      this.createChernoffMap();
    });
  }

  formatData(inputData) {
    //Convert any string value in the data set to numerical value
    inputData = inputData.map(item => {
      if (typeof item === 'object') {
        for (let key in item) {
          if (item.hasOwnProperty(key)) item[key] = Number(item[key]);
        }
      }
      return item;
    });
    //Wrap all the properties inside data object
    inputData = inputData.map(item => {
      item.data = JSON.parse(JSON.stringify(item));
      for (let key in item) {
        if (key !== 'data') {
          delete item[key];
        }
      }
      return item;
    });
    return inputData;
  }

  computeTranslatePosition(inputData) {
    //Fill x and y position for every chernoff image
    let translateX = 30;
    let translateY = 30;
    const marginX = 145;
    const marginY = 175;
    inputData.forEach((item, index) => {
      if (index !== 0) {
        translateX += marginX;
      }
      if (translateX > this.svgWidth - marginX / 2) {
        translateX = 30;
        translateY += marginY;
      }
      item.x = translateX;
      item.y = translateY;
    });
    return inputData;
  }

  fillAttributeDropdown(attributes) {
    attributes = attributes.slice(1, attributes.length);
    const selectList = document.querySelectorAll('.wine-variants select');
    selectList.forEach(item => {
      item.addEventListener('change', () => this.handleChange());
      attributes.forEach(el => {
        const option = document.createElement('option');
        option.text = el;
        item.add(option);
      });
    });
    attributes.forEach(el => {
      const option = document.createElement('option');
      option.text = el;
      this.sortingAttribute.add(option);
    });
    this.wineColorIntensity.value = 'Color intensity';
    this.amountOfWine.value = 'Alcohol';
    this.iceCubeSize.value = 'Ash';
    this.strawPipePosition.value = 'Proline';
  }

  handleChange(event) {
    document.querySelector('.chernoff-map').innerHTML = '';
    this.createChernoffMap();
  }

  createChernoffMap() {
    const gMap = this.chernoffMapSvg.append('g');
    gMap
      .selectAll('.border-box')
      .data(this.svgData)
      .enter()
      .append('rect')
      .attr('class', 'border-box')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', 130)
      .attr('height', 130)
      .attr('stroke', 'gray')
      .attr('stroke-width', '2px')
      .attr('fill', 'transparent');

    const glass = gMap
      .selectAll('.wine-glass')
      .data(this.svgData)
      .enter()
      .append('g')
      .attr('class', 'wine-glass');

    glass.append('defs').html(d => {
      d.colorId = this.generateUniqueId();
      const fill = this.computeGradientPercentage(d);
      const noFill = 100 - fill;
      return `<linearGradient id="${d.colorId}" x2="0%" y2="100%">
         <stop offset="${noFill}%" stop-color="white" />
         <stop offset="${fill}%" stop-color="${this.getGlassColor(d)}" />
       </linearGradient>
       `;
    });

    glass
      .append('rect')
      .attr('x', d => d.x + 45)
      .attr('y', d => d.y + 30)
      .attr('width', 40)
      .attr('height', 80)
      .attr('stroke', 'black')
      .attr('stroke-width', '1px')
      .attr('rx', 13)
      .attr('fill', d => `url(#${d.colorId})`);

    glass
      .append('ellipse')
      .attr('cx', d => d.x + 65)
      .attr('cy', d => d.y + 36.5)
      .attr('rx', 20)
      .attr('ry', 7)
      .attr('fill', 'white')
      .attr('stroke', 'black');

    //Ice cube
    const cube = glass.append('g').attr('transform', d => {
      const value = this.reduceValue(d.data[this.iceCubeSize.value], 3, 2.9);
      const limitValue = this.limitMinMaxValue(value, 1, 3);
      return `translate(${d.x + 50}, ${d.y + 80}) scale(${limitValue})`;
    });
    cube
      .append('path')
      .attr('d', 'M0 0l5 3v5l-5 -3z')
      .attr('fill', 'transparent')
      .attr('stroke', 'gray')
      .attr('stroke-width', 0.5);
    cube
      .append('path')
      .attr('d', 'M10 0l-5 3v5l5 -3')
      .attr('fill', 'transparent')
      .attr('stroke-width', 0.5)
      .attr('stroke', 'gray');
    cube
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 5)
      .attr('y2', -3)
      .attr('stroke-width', 0.5)
      .attr('stroke', 'gray');
    cube
      .append('line')
      .attr('x1', 5)
      .attr('y1', -3)
      .attr('x2', 10)
      .attr('y2', 0)
      .attr('stroke-width', 0.5)
      .attr('stroke', 'gray');

    cube
      .append('line')
      .attr('x1', 10)
      .attr('y1', 0)
      .attr('x2', 10)
      .attr('y2', 5)
      .attr('stroke-width', 0.5)
      .attr('stroke', 'gray');

    //Straw pipe
    const strawPipe = glass.append('g');
    strawPipe
      .append('rect')
      .attr('x', d => {
        let value = d.data[this.strawPipePosition.value];
        value = value < 1 ? value * 10 : value;
        const reducedValue = this.reduceValue(value, 28, 27.9);
        const limitValue = this.limitMinMaxValue(reducedValue, 1, 28);
        return d.x + 49 + limitValue;
      })
      .attr('y', d => d.y + 18)
      .attr('width', 3)
      .attr('height', 89)
      .attr('fill', 'lightgray')
      .attr('stroke', 'gray');
  }

  generateUniqueId() {
    return `${new Date().getTime()}-${Math.random()
      .toString(36)
      .substr(1, 5)}`;
  }

  computeGradientPercentage(d) {
    let value = d.data[this.amountOfWine.value];
    if (value < 10) {
      value = value * 10;
    } else if (value > 100) {
      value = value % 99.9;
    }
    return value.toFixed(2);
  }

  reduceValue(value, maxValue, reducer) {
    if (value > maxValue) {
      value = value % reducer;
    }
    return value;
  }

  limitMinMaxValue(value, minValue, maxValue) {
    if (value <= minValue) {
      value = minValue;
    } else if (value >= maxValue) {
      value = maxValue;
    }
    return value;
  }

  getGlassColor(d) {
    const value = this.reduceValue(
      d.data[this.wineColorIntensity.value],
      1,
      0.9
    );
    const limitValue = this.limitMinMaxValue(value, 0, 1);
    return d3.interpolateOrRd(limitValue);
  }

  disableApply() {
    this.applyButton.disabled = true;
    if (this.sortingAttribute.value && this.sortingOrder.value) {
      this.applyButton.disabled = false;
    } else {
      this.svgData = JSON.parse(JSON.stringify(this.initialSvgData));
    }
    this.handleChange();
  }

  applySorting() {
    this.svgData.sort((el1, el2) => {
      if (this.sortingOrder.value === 'aesc')
        return (
          el1.data[this.sortingAttribute.value] -
          el2.data[this.sortingAttribute.value]
        );
      else {
        return (
          el2.data[this.sortingAttribute.value] -
          el1.data[this.sortingAttribute.value]
        );
      }
    });
    this.svgData = this.computeTranslatePosition(this.svgData);
    this.handleChange();
  }
}
new ChernoffWineGlassMap();
