// =========== define components ===========

class Gate extends Component {
    static DEFAULT_SIZE = 70;
    static TICK         = 75;
    
    constructor(pos, expr, style) {
        super(pos, Gate.DEFAULT_SIZE, style);
        this.expr = expr;
        
        this.tick = undefined;
    }

    // eval
    
    evaluate(args, time) {
        let state = args.length === 0 ? false : this.expr(args, time);
        if (state) {
            setTimeout(() => {
                this.state = true;
            }, Gate.TICK);
            // this.tick = animate({
            //     wait:     Gate.TICK,
            //     duration: 2,
            //     timing:   (time) => time,
            //     callback: (time) => {  },
                
            //     post: () => {
            //         this.state = true;
            //         this.tick  = undefined;
            //     }
            // });
        } else {
            setTimeout(() => {
                this.state = false;
            }, Gate.TICK);
            // this.tick = animate({
            //     wait:     Gate.TICK,
            //     duration: 2,
            //     timing:   (time) => time,
            //     callback: (time) => {  },
                
            //     post: () => {
            //         this.state = false;
            //         this.tick  = undefined;
            //     }
            // });
        }
    }

    // utility

    type() {
        return 'gate';
    }
}

class GateAnd extends Gate {
    constructor(pos) {
        super(pos, (args) => args.reduce((a, b) => a && b), {
            text: 'and',
            icon: (pos, color, ctx) => {
                drawText({
                    ctx:      ctx,
                    pos:      pos,
                    text:     '&',
                    fontSize: '30px',
                    color:     color
                });
            },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#304A41', color200: '#445C54', color300: '#7EBDAE' }
        });
    }

    // utility

    type() {
        return 'gate:and';
    }
}

class GateOr extends Gate {
    constructor(pos) {
        super(pos, (args) => args.reduce((a, b) => a || b), {
            text: 'or',
            icon: (pos, color, ctx) => {
                drawText({
                    ctx:      ctx,
                    pos:      pos,
                    text:     '|',
                    fontSize: '30px',
                    color:     color
                });
            },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#4A3D7B', color200: '#674C9E', color300: '#9A74DE' }
        });
    }

    // utility

    type() {
        return 'gate:or';
    }
}

class GateNot extends Gate {
    constructor(pos) {
        super(pos, (args) => !args.reduce((a, b) => a || b), {
            text: 'not',
            icon: (pos, color, ctx) => {
                drawText({
                    ctx:      ctx,
                    pos:      pos,
                    text:     '~',
                    fontSize: '30px',
                    color:     color
                });
            },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#99125C', color200: '#AA3274', color300: '#DA1580' }
        });
    }

    // utility

    type() {
        return 'gate:not';
    }
}

class Lamp extends Component {
    static DEFAULT_SIZE = 70;
    
    constructor(pos) {
        super(pos, Lamp.DEFAULT_SIZE, {
            text: 'lamp',
            icon: () => { },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#EEDC5E', color200: '#6B632B', color300: '#EEDC5E' }
        });
        this.output = undefined;
    }
    
    evaluate(args, time) {
        this.state = args.reduce((a, b) => a && b);
    }

    // utility

    type() {
        return 'lamp';
    }
}

class Switch extends Component {
    static DEFAULT_SIZE = 70;
    
    constructor(pos) {
        super(pos, Switch.DEFAULT_SIZE, {
            text: 'switch',
            icon: () => { },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#EEDC5E', color200: '#6B632B', color300: '#EEDC5E' }
        });
        this.input = undefined;
    }
    
    click(event, time) {
        this.state = !this.state;
    }

    // utility

    type() {
        return 'switch';
    }
}

// =========== define components views ===========

const ComponentsViews = [
    [
        { id: 'and', tooltip: 'and', color: '#304A41', icon: '&', get: (pos) => new GateAnd(pos) },
        { id: 'or' , tooltip: 'or' , color: '#4A3D7B', icon: '|', get: (pos) => new GateOr(pos)  },
        { id: 'not', tooltip: 'not', color: '#99125C', icon: '~', get: (pos) => new GateNot(pos) }
    ],
    [
        { id: 'lamp'  , tooltip: 'lamp'  , color: '#5B5214', icon: 'l', get: (pos) => new Lamp(pos)   },
        { id: 'switch', tooltip: 'switch', color: '#5B5214', icon: 's', get: (pos) => new Switch(pos) }
    ]
];

// =========== serialize/deserialize ===========

function serialize(network) {
    let components = [ ];

    let globalID = 0;
    let allID = new Map();
    for (const component of network.components) {
        let id = undefined;
        if (allID.has(component.id)) {
            id = allID.get(component.id);
        } else {
            id = globalID++;
            allID.set(component.id, id);
        }
        components.push({
            id:   id + '',
            type: component.type(),
            posX: component.pos.getX(),
            posY: component.pos.getY()
        });
    }

    let connections = { };
    for (const [key, value] of network.connections) {
        connections[allID.get(key.id)] = [...value].map(({ id }) => allID.get(id) + '');
    }

    return {
        components:  components,
        connections: connections
    };
}

function deserialize(data, network) {
    let components = new Map();
    for (const { id, type, posX, posY } of data.components) {
        let point = new Point(posX, posY);
        let component = {
            'gate:and': () => new GateAnd(point),
            'gate:or' : () => new GateOr(point) ,
            'gate:not': () => new GateNot(point),
            'lamp'    : () => new Lamp(point)   ,
            'switch'  : () => new Switch(point) 
        }[type]();

        components.set(id, component);
    }

    network.clear();
    network.addComponents([...components.values()]);

    for (const idEnd in data.connections) {
        for (const idStart of data.connections[idEnd]) {
            network.linking(components.get(idStart), components.get(idEnd));
        }
    }
}