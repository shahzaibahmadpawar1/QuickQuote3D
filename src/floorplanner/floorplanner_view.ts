import { Floorplan } from '../model/floorplan'
import { Wall } from '../model/wall'
import { Corner } from '../model/corner'
import { Room } from '../model/room'
import { HalfEdge } from '../model/half_edge'
import { Dimensioning } from '../core/dimensioning'
import { Utils } from '../core/utils'
import type { Item } from '../items/item'
import type { Floorplanner } from './floorplanner'

/** */
export const floorplannerModes = {
  MOVE: 0,
  DRAW: 1,
  DELETE: 2
}

// grid parameters
const gridSpacing = 20 // pixels
const gridWidth = 1
const gridColor = '#f1f1f1'

// room config
const roomColor = '#f9f9f9'

// wall config
const wallWidth = 5
const wallWidthHover = 7
const wallColor = '#dddddd'
const wallColorHover = '#008cba'
const edgeColor = '#888888'
const edgeColorHover = '#008cba'
const edgeWidth = 1
const doorColor = '#5b5b5b'
const doorLeafColor = '#2f2f2f'
const doorRadius = 16

const deleteColor = '#ff0000'

// corner config
const cornerRadius = 0
const cornerRadiusHover = 7
const cornerColor = '#cccccc'
const cornerColorHover = '#008cba'

/**
 * The View to be used by a Floorplanner to render in/interact with.
 */
export class FloorplannerView {
  /** The canvas element. */
  private canvasElement: HTMLCanvasElement

  /** The 2D context. */
  private context: CanvasRenderingContext2D

  /** Resize handler reference for cleanup */
  private resizeHandler: () => void

  /** */
  constructor(
    private floorplan: Floorplan,
    private viewmodel: Floorplanner,
    private canvas: string
  ) {
    this.canvasElement = document.getElementById(canvas) as HTMLCanvasElement
    this.context = this.canvasElement.getContext('2d') as CanvasRenderingContext2D

    // Bind resize handler for later cleanup
    this.resizeHandler = () => {
      this.handleWindowResize()
    }
    window.addEventListener('resize', this.resizeHandler)
    this.handleWindowResize()
  }

  /** Cleanup method to remove event listeners */
  public destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  }

  /** */
  public handleWindowResize() {
    const canvasElement = document.getElementById(this.canvas) as HTMLCanvasElement
    // Check if canvas element exists before accessing parentElement
    if (!canvasElement) {
      console.warn('Canvas element not found:', this.canvas)
      return
    }
    const parent = canvasElement.parentElement
    if (parent) {
      const parentHeight = parent.clientHeight
      const parentWidth = parent.clientWidth
      canvasElement.style.height = parentHeight + 'px'
      canvasElement.style.width = parentWidth + 'px'
      this.canvasElement.height = parentHeight
      this.canvasElement.width = parentWidth
    }
    this.draw()
  }

  /** */
  public draw() {
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)

    this.drawGrid()

    this.floorplan.getRooms().forEach((room) => {
      this.drawRoom(room)
    })

    this.floorplan.getWalls().forEach((wall) => {
      this.drawWall(wall)
      this.drawWallItems(wall)
    })

    this.floorplan.getCorners().forEach((corner) => {
      this.drawCorner(corner)
    })

    if (this.viewmodel.mode == floorplannerModes.DRAW) {
      this.drawTarget(this.viewmodel.targetX, this.viewmodel.targetY, this.viewmodel.lastNode)
    }

    this.floorplan.getWalls().forEach((wall) => {
      this.drawWallLabels(wall)
    })
  }

  /** */
  private drawWallLabels(wall: Wall) {
    // Show the wall's true start->end length so labels match typed input.
    const length = wall.getLengthCm()
    if (length < 60) {
      return
    }

    let labelX = this.viewmodel.convertX((wall.getStartX() + wall.getEndX()) / 2)
    let labelY = this.viewmodel.convertY((wall.getStartY() + wall.getEndY()) / 2)

    // Prefer placing text near an edge interior center for readability.
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance < wall.frontEdge.interiorDistance) {
        const pos = wall.backEdge.interiorCenter()
        labelX = this.viewmodel.convertX(pos.x)
        labelY = this.viewmodel.convertY(pos.y)
      } else {
        const pos = wall.frontEdge.interiorCenter()
        labelX = this.viewmodel.convertX(pos.x)
        labelY = this.viewmodel.convertY(pos.y)
      }
    } else if (wall.backEdge) {
      const pos = wall.backEdge.interiorCenter()
      labelX = this.viewmodel.convertX(pos.x)
      labelY = this.viewmodel.convertY(pos.y)
    } else if (wall.frontEdge) {
      const pos = wall.frontEdge.interiorCenter()
      labelX = this.viewmodel.convertX(pos.x)
      labelY = this.viewmodel.convertY(pos.y)
    }

    this.context.font = 'normal 12px Arial'
    this.context.fillStyle = '#000000'
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.strokeStyle = '#ffffff'
    this.context.lineWidth = 4

    const label = Dimensioning.cmToMeasure(length)
    this.context.strokeText(label, labelX, labelY)
    this.context.fillText(label, labelX, labelY)
  }

  /** */
  private drawWall(wall: Wall) {
    const hover = wall === this.viewmodel.activeWall
    let color = wallColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = wallColorHover
    }
    this.drawLine(
      this.viewmodel.convertX(wall.getStartX()),
      this.viewmodel.convertY(wall.getStartY()),
      this.viewmodel.convertX(wall.getEndX()),
      this.viewmodel.convertY(wall.getEndY()),
      hover ? wallWidthHover : wallWidth,
      color
    )
    if (!hover && wall.frontEdge) {
      this.drawEdge(wall.frontEdge, hover)
    }
    if (!hover && wall.backEdge) {
      this.drawEdge(wall.backEdge, hover)
    }
  }

  /** */
  private drawWallItems(wall: Wall) {
    const startX = wall.getStartX()
    const startY = wall.getStartY()
    const endX = wall.getEndX()
    const endY = wall.getEndY()
    const dx = endX - startX
    const dy = endY - startY
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length < 1e-6) return

    wall.items.forEach((item) => {
      const itemType = Number(item.metadata?.itemType)
      if (itemType !== 7) return
      this.drawDoorSymbol(item, startX, startY, dx, dy, length)
    })
  }

  /** */
  private drawDoorSymbol(item: Item, wallStartX: number, wallStartY: number, dx: number, dy: number, wallLength: number) {
    const itemX = item.position.x
    const itemY = item.position.z
    const t = ((itemX - wallStartX) * dx + (itemY - wallStartY) * dy) / (wallLength * wallLength)
    const clampedT = Math.max(0.05, Math.min(0.95, t))
    const hingeWorldX = wallStartX + dx * clampedT
    const hingeWorldY = wallStartY + dy * clampedT
    const openWorldX = hingeWorldX + (dx / wallLength) * doorRadius
    const openWorldY = hingeWorldY + (dy / wallLength) * doorRadius

    const hingeCanvasX = this.viewmodel.convertX(hingeWorldX)
    const hingeCanvasY = this.viewmodel.convertY(hingeWorldY)
    const openCanvasX = this.viewmodel.convertX(openWorldX)
    const openCanvasY = this.viewmodel.convertY(openWorldY)
    const radiusPx = Math.sqrt(
      Math.pow(openCanvasX - hingeCanvasX, 2) + Math.pow(openCanvasY - hingeCanvasY, 2)
    )
    const angle = Math.atan2(openCanvasY - hingeCanvasY, openCanvasX - hingeCanvasX)

    this.context.beginPath()
    this.context.moveTo(hingeCanvasX, hingeCanvasY)
    this.context.lineTo(openCanvasX, openCanvasY)
    this.context.lineWidth = 2
    this.context.strokeStyle = doorLeafColor
    this.context.stroke()

    this.context.beginPath()
    this.context.arc(hingeCanvasX, hingeCanvasY, radiusPx, angle, angle + Math.PI / 2, false)
    this.context.lineWidth = 2
    this.context.strokeStyle = doorColor
    this.context.stroke()
  }

  /** */
  private drawEdgeLabel(edge: HalfEdge) {
    const pos = edge.interiorCenter()
    const length = edge.interiorDistance()
    if (length < 60) {
      // dont draw labels on walls this short
      return
    }
    this.context.font = 'normal 12px Arial'
    this.context.fillStyle = '#000000'
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.strokeStyle = '#ffffff'
    this.context.lineWidth = 4

    this.context.strokeText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    )
    this.context.fillText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    )
  }

  /** */
  private drawEdge(edge: HalfEdge, hover: boolean) {
    let color = edgeColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = edgeColorHover
    }
    const corners = edge.corners()

    this.drawPolygon(
      Utils.map(corners, (corner) => {
        return this.viewmodel.convertX(corner.x)
      }),
      Utils.map(corners, (corner) => {
        return this.viewmodel.convertY(corner.y)
      }),
      false,
      null,
      true,
      color,
      edgeWidth
    )
  }

  /** */
  private drawRoom(room: Room) {
    this.drawPolygon(
      Utils.map(room.corners, (corner: Corner) => {
        return this.viewmodel.convertX(corner.x)
      }),
      Utils.map(room.corners, (corner: Corner) => {
        return this.viewmodel.convertY(corner.y)
      }),
      true,
      roomColor
    )
  }

  /** */
  private drawCorner(corner: Corner) {
    const hover = corner === this.viewmodel.activeCorner
    let color = cornerColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = cornerColorHover
    }
    this.drawCircle(
      this.viewmodel.convertX(corner.x),
      this.viewmodel.convertY(corner.y),
      hover ? cornerRadiusHover : cornerRadius,
      color
    )
  }

  /** */
  private drawTarget(x: number, y: number, lastNode: Corner | null) {
    this.drawCircle(
      this.viewmodel.convertX(x),
      this.viewmodel.convertY(y),
      cornerRadiusHover,
      cornerColorHover
    )
    if (this.viewmodel.lastNode) {
      this.drawLine(
        this.viewmodel.convertX(lastNode!.x),
        this.viewmodel.convertY(lastNode!.y),
        this.viewmodel.convertX(x),
        this.viewmodel.convertY(y),
        wallWidthHover,
        wallColorHover
      )
    }
  }

  /** */
  private drawLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    width: number,
    color: string
  ) {
    // width is an integer
    // color is a hex string, i.e. #ff0000
    this.context.beginPath()
    this.context.moveTo(startX, startY)
    this.context.lineTo(endX, endY)
    this.context.lineWidth = width
    this.context.strokeStyle = color
    this.context.stroke()
  }

  /** */
  private drawPolygon(
    xArr: number[],
    yArr: number[],
    fill?: boolean,
    fillColor?: string | null,
    stroke?: boolean,
    strokeColor?: string,
    strokeWidth?: number
  ) {
    // fillColor is a hex string, i.e. #ff0000
    fill = fill || false
    stroke = stroke || false
    this.context.beginPath()
    this.context.moveTo(xArr[0], yArr[0])
    for (let i = 1; i < xArr.length; i++) {
      this.context.lineTo(xArr[i], yArr[i])
    }
    this.context.closePath()
    if (fill && fillColor) {
      this.context.fillStyle = fillColor
      this.context.fill()
    }
    if (stroke && strokeColor) {
      this.context.lineWidth = strokeWidth!
      this.context.strokeStyle = strokeColor
      this.context.stroke()
    }
  }

  /** */
  private drawCircle(centerX: number, centerY: number, radius: number, fillColor: string) {
    this.context.beginPath()
    this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
    this.context.fillStyle = fillColor
    this.context.fill()
  }

  /** returns n where -gridSize/2 < n <= gridSize/2  */
  private calculateGridOffset(n: number): number {
    if (n >= 0) {
      return ((n + gridSpacing / 2.0) % gridSpacing) - gridSpacing / 2.0
    } else {
      return ((n - gridSpacing / 2.0) % gridSpacing) + gridSpacing / 2.0
    }
  }

  /** */
  private drawGrid() {
    const offsetX = this.calculateGridOffset(-this.viewmodel.originX)
    const offsetY = this.calculateGridOffset(-this.viewmodel.originY)
    const width = this.canvasElement.width
    const height = this.canvasElement.height
    for (let x = 0; x <= width / gridSpacing; x++) {
      this.drawLine(
        gridSpacing * x + offsetX,
        0,
        gridSpacing * x + offsetX,
        height,
        gridWidth,
        gridColor
      )
    }
    for (let y = 0; y <= height / gridSpacing; y++) {
      this.drawLine(
        0,
        gridSpacing * y + offsetY,
        width,
        gridSpacing * y + offsetY,
        gridWidth,
        gridColor
      )
    }
  }
}
