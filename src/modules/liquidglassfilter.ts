export const liquidGlassFilters: Record<string, string> = {
  'neo-superfusion-liquidglass-500': `
    <filter id="neo-superfusion-liquidglass-500" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="500" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-1000': `
    <filter id="neo-superfusion-liquidglass-1000" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="1000" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-1500': `
    <filter id="neo-superfusion-liquidglass-1500" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="1500" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-2000': `
    <filter id="neo-superfusion-liquidglass-2000" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="2000" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-2500': `
    <filter id="neo-superfusion-liquidglass-2500" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="2500" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-3000': `
    <filter id="neo-superfusion-liquidglass-3000" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="3000" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-3500': `
    <filter id="neo-superfusion-liquidglass-3500" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="3500" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-4000': `
    <filter id="neo-superfusion-liquidglass-4000" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="4000" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-4500': `
    <filter id="neo-superfusion-liquidglass-4500" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="4500" height="80" result="mapSource" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
  'neo-superfusion-liquidglass-5000': `
    <filter id="neo-superfusion-liquidglass-5000" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
      <feImage href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAACgCAYAAAAmYr3BAAAAdElEQVR42u3GKwpCAQBE0bsP1+AKzEabyWIwCIKIiOLf2fmVaS9ZLS8cOCRYjBkzZszf8sH6mTfWIC+sQZ5YgzywyB2L3LDIFYtcsMgZi5ywyBGLHLDIHovssMgWi2ywyBqLrLDIEosssMgci8ywyBSLTLC+Ext5gTojh4cAAAAASUVORK5CYII=" x="0" y="0" width="5000" height="80" result="mapTile" preserveAspectRatio="none" />
      <feTile in="mapTile" result="mapSource" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="61.42130957895092" xChannelSelector="R" yChannelSelector="G" result="dispR" />
      <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="R" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="66.76229302059882" xChannelSelector="R" yChannelSelector="G" result="dispG" />
      <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="G" />
      <feDisplacementMap in="SourceGraphic" in2="mapSource" scale="72.10327646224673" xChannelSelector="R" yChannelSelector="G" result="dispB" />
      <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="B" />
      <feBlend in="R" in2="G" mode="screen" result="RG" />
      <feBlend in="RG" in2="B" mode="screen" result="refracted" />
      <feComposite in="refracted" in2="SourceGraphic" operator="in" />
    </filter>`,
};
