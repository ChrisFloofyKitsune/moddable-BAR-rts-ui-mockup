console.log(document);

let dropZoneId = null;

const exampleRtsUiNames = [
    'Minimap',
    'Metal Resource',
    'Energy Resource',
    'Unit Info',
    'Unit Commands',
    'Unit State Toggles',
    'Build Menu',
    // 'Unit Selection',
]

function setupDragEvents(element) {
    const fromToolbar = element.parentElement.id === 'draggables-list';

    element.addEventListener('dragstart', (event) => {
        const payload = {id: element.id, fromToolbar};
        event.dataTransfer.setData('text/plain', JSON.stringify(payload));
    });

    element.addEventListener('dragend', (event) => {
        console.log('drag end', event.target);
        const payload = JSON.parse(event.dataTransfer.getData('text/plain'));
        if (!dropZoneId && !payload.fromToolbar) {
            element.remove();
        }
    });
}

// fill draggables-list element with some mock-up RTS ui elements
let draggablesList = document.getElementById('draggables-list');
for (const name of exampleRtsUiNames) {
    console.log(name);
    const codeSafeName = name.toLowerCase().replaceAll(' ', '-');

    const newElement = document.createElement('div');
    newElement.classList.add('ui-element');
    newElement.classList.add(codeSafeName);
    newElement.id = codeSafeName;
    newElement.setAttribute('draggable', 'true');
    newElement.textContent = name;
    draggablesList.appendChild(newElement);

    // add event listeners for drag and drop
    setupDragEvents(newElement);
}



/**
 * Create a new set of UI zones in a ring formation
 * This is done by stacking flexboxes inside each other
 *
 *     diagram of final layout:
 *
 *     ┌─OUTER───────────────────────┐
 *     │ ┌─VERTICAL────────────────┐ │
 *     │ │ top                     │ │
 *     │ ├─────┬─HORIZONTAL──┬─────┤ │
 *     │ │     │             │     │ │
 *     │ │left │   INNER     │right│ │
 *     │ │     │             │     │ │
 *     │ ├─────┴─────────────┴─────┤ │
 *     │ │ bottom                  │ │
 *     │ └─────────────────────────┘ │
 *     └─────────────────────────────┘
 *
 */
function createUIZoneRing() {
    const parent = document.querySelector('[data-next-ui-zone]');
    console.log('Adding UI Zone ring to', parent);

    const container = document.createElement('div');
    container.classList.add('ui-container');

    const verticalLayout = document.createElement('div');
    verticalLayout.classList.add('ui-layout', 'ui-layout-vertical');

    const topArea = document.createElement('div');
    topArea.classList.add('ui-zone', 'ui-zone-horizontal', 'ui-zone-top');
    const bottomArea = document.createElement('div');
    bottomArea.classList.add('ui-zone', 'ui-zone-horizontal', 'ui-zone-bottom');

    // create inner zone
    const horizontalLayout = document.createElement('div');
    horizontalLayout.classList.add('ui-layout', 'ui-layout-horizontal');

    // create left and right zones
    const leftArea = document.createElement('div');
    leftArea.classList.add('ui-zone', 'ui-zone-vertical', 'ui-zone-left');
    const rightArea = document.createElement('div');
    rightArea.classList.add('ui-zone', 'ui-zone-vertical', 'ui-zone-right');

    // create inner area
    const innerArea = document.createElement('div');
    innerArea.classList.add('ui-layout', 'ui-layout-inner');

    // Assemble the zones
    horizontalLayout.appendChild(leftArea);
    horizontalLayout.appendChild(innerArea);
    horizontalLayout.appendChild(rightArea);

    verticalLayout.appendChild(topArea);
    verticalLayout.appendChild(horizontalLayout);
    verticalLayout.appendChild(bottomArea);

    container.appendChild(verticalLayout);
    parent.appendChild(container);

    // Move the data-next-ui-zone attribute to the inner zone
    const nextUiZone = parent.getAttribute('data-next-ui-zone');
    innerArea.setAttribute('data-next-ui-zone', nextUiZone);
    parent.removeAttribute('data-next-ui-zone');

    // add event listeners for drag and drop
    const zones = [topArea, bottomArea, leftArea, rightArea];
    for (const zone of zones) {
        zone.setAttribute('data-ui-zone', 'true');
        zone.id = 'ui-zone-' + Math.random().toString(36).substring(7);

        zone.addEventListener('dragenter', (event) => {
            event.preventDefault();
            
            if (event.target.hasAttribute('data-ui-zone')) {
                dropZoneId = event.target.id;
                event.target.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (event) => {
            console.log('drag leave', event.target);
            event.target.classList.remove('drag-over');
            dropZoneId = null;
        });
        
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        zone.addEventListener('drop', (event) => {
            console.log('drop', event.target);
            event.preventDefault();
            
            let target = event.target;
            // get nearest zone
            if (!target.hasAttribute('data-ui-zone')) {
                target = target.closest('[data-ui-zone]');
            }
            
            target.classList.remove('drag-over');
            dropZoneId = target.id;
            
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            const draggable = document.getElementById(data.id);
            
            let droppedElement;
            if (data.fromToolbar) {
                const newElement = draggable.cloneNode(true);
                newElement.id = draggable.id + '-' + Math.random().toString(36).substring(7);
                zone.appendChild(newElement);
                setupDragEvents(newElement);
                droppedElement = newElement;
            } else {
                zone.appendChild(draggable);
                droppedElement = draggable;
            }
            
            // determine the drop position
            const rect = target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            console.log('drop position', x, y);
            
            // remove ui-position-* classes
            droppedElement.classList.remove('ui-position-left', 'ui-position-right', 'ui-position-top', 'ui-position-bottom', 'ui-position-center');
            
            // determine if the drop was left/top, center, or right/bottom
            if (target.classList.contains('ui-zone-horizontal')) {
                if (x < rect.width / 3) {
                    console.log('left');
                    droppedElement.classList.add('ui-position-left');
                    droppedElement.style.order = '-1';
                } else if (x > rect.width * 2 / 3) {
                    console.log('right');
                    droppedElement.classList.add('ui-position-right');
                    droppedElement.style.order = '1';
                } else {
                    console.log('center');
                    droppedElement.classList.add('ui-position-center');
                    droppedElement.style.order = '0';
                }
            } else if (target.classList.contains('ui-zone-vertical')) {
                if (y < rect.height / 3) {
                    console.log('top');
                    droppedElement.classList.add('ui-position-top');
                    droppedElement.style.order = '-1';
                } else if (y > rect.height * 2 / 3) {
                    console.log('bottom');
                    droppedElement.classList.add('ui-position-bottom');
                    droppedElement.style.order = '1';
                } else {
                    console.log('center');
                    droppedElement.classList.add('ui-position-center');
                    droppedElement.style.order = '0';
                }
            }
        });
    }
}

createUIZoneRing();
createUIZoneRing();
createUIZoneRing();

// listen to changes in the mockup's size
const mockup = document.getElementById('mockup-area');
const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        const {width, height} = entry.contentRect;
        // and update the css variables on the body
        document.body.style.setProperty('--mockup-width', `${width}px`);
        document.body.style.setProperty('--mockup-height', `${height}px`);
    }
});
observer.observe(mockup);
