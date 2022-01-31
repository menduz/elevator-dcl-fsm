import { StateMachineComponent } from "./fsm"

const elevator = new Entity()
engine.addEntity(elevator)

/**
 * States:
 * - IdleOpen(floorIndex)
 * - OpeningDoor(floorIndex)
 * - IdleClosed(floorIndex, toFloorIndex)
 * - ClosingDoor(floorIndex, toFloorIndex)
 * - MovingUp(toFloorIndex)
 * - MovingDown(toFloorIndex)
 * FSM Parameters:
 * - ElevatorVelocity: number // m/s
 * - FloorHeights: number[]
 * - InicialFloorIndex: number
 * Events:
 * - GoToFloor(toFloorIndex)
 */

type ElevatorEvents = {
  GoToFloor: { floorNumber: number }
}

type ElevatorState = { floorIndex: number; toFloorIndex: number }

const fsm = elevator.addComponent(
  new StateMachineComponent<ElevatorEvents, ElevatorState>({
    IdleOpen: {
      onGoToFloor(currentStateValues, eventParams) {
        fsm.setState("ClosingDoor", { ...currentStateValues, toFloorIndex: eventParams.floorNumber })
      },
    },

    IdleClosed: {
      onEnter(currentStateValues) {
        if (currentStateValues.floorIndex == currentStateValues.toFloorIndex) {
          fsm.setState("OpeningDoor", currentStateValues)
        } else if (currentStateValues.floorIndex < currentStateValues.toFloorIndex) {
          fsm.setState("MovingUp", currentStateValues)
        } else if (currentStateValues.floorIndex > currentStateValues.toFloorIndex) {
          fsm.setState("MovingDown", currentStateValues)
        }
      },
    },

    OpeningDoor: {
      onUpdate(entity, currentStateValues) {
        // animate opening door
        const isDoorCompleteleyOpen = true
        if (isDoorCompleteleyOpen) {
          fsm.setState("IdleOpen", currentStateValues)
        }
      },
    },

    ClosingDoor: {
      onUpdate(entity, currentStateValues) {
        // animate closing door
        const isDoorCompleteleyClosed = true

        if (isDoorCompleteleyClosed) {
          if (currentStateValues.toFloorIndex > currentStateValues.floorIndex) {
            fsm.setState("MovingUp", currentStateValues)
          } else if (currentStateValues.toFloorIndex < currentStateValues.floorIndex) {
            fsm.setState("MovingDown", currentStateValues)
          } else {
            fsm.setState("OpeningDoor", currentStateValues)
          }
        }
      },
    },

    MovingUp: {
      onUpdate(entity, currentStateValues, dt) {
        const desiredAltitude = currentStateValues.toFloorIndex * 2

        const t = entity.getComponentOrCreate(Transform)

        t.position.y += dt

        if (t.position.y >= desiredAltitude) {
          t.position.y = desiredAltitude
          fsm.setState("IdleClosed", { ...currentStateValues, floorIndex: currentStateValues.toFloorIndex })
        }
      },
    },

    MovingDown: {
      onUpdate(entity, currentStateValues, dt) {
        const desiredAltitude = currentStateValues.toFloorIndex * 2

        const t = entity.getComponentOrCreate(Transform)

        t.position.y -= dt

        if (t.position.y <= desiredAltitude) {
          t.position.y = desiredAltitude
          fsm.setState("IdleClosed", { ...currentStateValues, floorIndex: currentStateValues.toFloorIndex })
        }
      },
    },
  })
)

// OnPointerDown
fsm.notifyEvent("GoToFloor", { floorNumber: 10 })

fsm.setState("IdleOpen", { floorIndex: 0, toFloorIndex: 0 })

elevator.getComponentOrCreate(Transform).position.set(4, 0.1, 4)

const sphere = new SphereShape()
const buttonMaterial = new Material()
buttonMaterial.albedoColor = new Color3()
buttonMaterial.albedoColor!.set(1, 0, 0)

function createButton(toFloor: number, parent: Entity) {
  const buttonEntity = new Entity()
  engine.addEntity(buttonEntity)
  buttonEntity.setParent(parent)
  buttonEntity.addComponent(sphere)
  buttonEntity.addComponent(buttonMaterial)
  buttonEntity.addComponent(
    new OnPointerDown(() => {
      fsm.notifyEvent("GoToFloor", { floorNumber: toFloor })
    })
  )
  const t = buttonEntity.addComponent(new Transform())
  t.position.y = 1 + 0.15 * toFloor
  t.scale.setAll(0.05)
}

createButton(1, elevator)
createButton(2, elevator)
createButton(3, elevator)
createButton(4, elevator)
createButton(5, elevator)

const platform = new Entity()
engine.addEntity(platform)
platform.getComponentOrCreate(Transform).scale.set(4, 0.01, 4)
platform.getComponentOrCreate(BoxShape)
platform.setParent(elevator)
