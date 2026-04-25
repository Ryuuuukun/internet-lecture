// =========== math =========== 

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    getX() {
        return Math.floor(this.x);
    }

    getY() {
        return Math.floor(this.y);
    }
}

class FollowPoint {
    constructor(follow, dx, dy) {
        this.follow = follow;
        this.dx = dx;
        this.dy = dy;
    }

    getX() {
        return Math.floor(this.dx) + this.follow.getX();
    }

    getY() {
        return Math.floor(this.dy) + this.follow.getY();
    }
}



// =========== animate =========== 

function animate({ wait, duration, timing, callback, pre, post }) {
    let quit  = false;
    let start = performance.now();

    if (pre !== undefined) {
        pre();
    }

    setTimeout(() => {
        requestAnimationFrame(function frame(time) {
            if (quit) {
                return;
            }
            let progress = (time - (start + wait)) / duration;
            if (progress > 1) {
                progress = 1;
            }

            callback(timing(progress));
            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                if (post != undefined) {
                    post();
                }
            }
        });
    }, wait);

    return {
        quit: () => quit = true
    }
}

function animateFrames({ frames, wait, duration, timing, pre, post }) {
    let frame = 0;
    return animate({
        wait:     wait,
        duration: duration,
        timing:   timing,
        callback: (time) => {
            frames[frame]();
            if (time > (frame + 1) / frames.length) {
                ++frame;
            }
        },
        pre:  pre,
        post: post
    });
} 

const Times = {
    linear: (time) => time,
    ease:   (time) => time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time
};

class NumberAnimate {
    constructor(init, timing) {
        this.value = init;
        this.timing = timing || Times.linear;
        
        this.holder = undefined;
    }

    to({ value, duration, pre, post }) {
        if (this.holder !== undefined) {
            this.holder.quit();
        }

        let start = this.value;
        let delta = value - this.value;
        this.holder = animate({
            wait:  0,
            duration: duration,
            timing:   this.timing,
            callback: (time) => this.value = start + delta * time,
            pre:  () => {
                if (pre !== undefined) {
                    pre();
                }
            },
            post: () => {
                this.holder = undefined
                if (post !== undefined) {
                    post();
                }
            }
        });
    }

    stop() {
        if (this.holder !== undefined) {
            this.holder.quit();
        }
    }

    set(value) {
        this.value = value;
    }

    get() {
        return this.value;
    }
}



// =========== drawable =========== 

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();       
    ctx.moveTo(x1, y1);      
    ctx.lineTo(x2, y2);  
    ctx.stroke();
}

function drawCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, Math.abs(radius), 0, 2 * Math.PI);
    ctx.fill();
}

function drawText({ ctx, pos, text, fontSize, color }) {
    ctx.font = `${fontSize} 'JetBrains Mono'`;
    ctx.fillStyle    = color;
    ctx.textAlign    = 'center'; 
    ctx.textBaseline = 'middle'; 
    ctx.fillText(text, pos.getX(), pos.getY());
}

function drawEmptyBlock({ ctx, pos, size, lineWidth, color }) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    drawLine(ctx, pos.getX() - size / 2, pos.getY() - size / 2, pos.getX() + size / 2, pos.getY() + size / 2);
    drawLine(ctx, pos.getX() - size / 2, pos.getY() + size / 2, pos.getX() + size / 2, pos.getY() - size / 2);
}

function drawLinesBlock({ ctx, pos, size, lineWidth, lineCount, color }) {
    ctx.lineWidth   = lineWidth;
    ctx.strokeStyle = color;
    for (let i = 0; i < lineCount; ++i) {
        drawLine(ctx,
            pos.getX() - size / 2,
            pos.getY() - size / 2 + i * (size / lineCount),
            pos.getX() - size / 2 + i * (size / lineCount),
            pos.getY() - size / 2
        );
    }
    for (let i = 0; i < lineCount; ++i) {
        drawLine(ctx,
            pos.getX() - size / 2 + i * (size / lineCount),
            pos.getY() + size / 2,
            pos.getX() + size / 2,
            pos.getY() - size / 2 + i * (size / lineCount) 
        ); 
    }
}

function drawFillBlock({ ctx, pos, size, icon, color }) {
    ctx.fillStyle = color;
    ctx.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    icon(ctx);
}

function drawOffComponent({ ctx, pos, size, lineWidth, icon, colors }) {      
    ctx.fillStyle = colors.color100;
    ctx.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colors.color200;
    ctx.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    ctx.fillStyle = colors.color300;
    drawCircle(ctx, pos.getX() - size / 2, pos.getY() - size / 2, 4);
    drawCircle(ctx, pos.getX() - size / 2, pos.getY() + size / 2, 4);
    drawCircle(ctx, pos.getX() + size / 2, pos.getY() - size / 2, 4);
    drawCircle(ctx, pos.getX() + size / 2, pos.getY() + size / 2, 4);
    icon(ctx);
}

function drawOnComponent({ ctx, pos, size, lineWidth, lineCount, icon, colors }) {
    ctx.shadowColor = `${colors.color300}${Math.floor(255 * 0.20).toString(16)}`; 
    ctx.shadowBlur  = 50;     

    ctx.fillStyle = colors.color100;
    ctx.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    drawLinesBlock({ ctx: ctx, pos: pos, size: size, lineWidth: lineWidth, lineCount: lineCount, color: colors.color200 });
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colors.color200;
    ctx.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
    icon(ctx);

    ctx.shadowBlur = 0;
}



// =========== events =========== 

class Events {
    constructor(canvas) {
        this.objects = [ ];

        this.canvas = canvas;

        this.mousemoveListeners = [ ];
        this.mousedownListeners = [ ];
        this.mouseupListeners   = [ ];
        this.keydownListeners   = [ ];

        document.addEventListener('keydown', (event) => {
            this.keydownListeners.forEach(({ listener }) => listener(event));
        });
        document.addEventListener('mousemove', (event) => {
            this.mousemoveListeners.forEach(({ listener }) => listener(event));
        });
        document.addEventListener('mousedown', (event) => {
            this.mousedownListeners.forEach(({ listener }) => listener(event));
        });
        document.addEventListener('mouseup', (event) => {
            this.mouseupListeners.forEach(({ listener }) => listener(event));
        });

        // select

        this.selection = true;

        this.selected = new Set();
        this.pressed  = false;
        this.lastMouseMove = undefined;

        this.add('mousedown', (event) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== canvas || !this.selection) {
                return;
            }

            this.pressed = true;

            let select = this.objects.filter(({ object }) => object.collision(event.clientX, event.clientY))
                                .sort((a, b) => b.index - a.index)[0];
            if (select !== undefined) {
                if (!event.shiftKey && !this.selected.has(select.object)) {
                    this.clearSelected();
                }

                if (event.shiftKey) {
                    select.object.selected = !select.object.selected;
                    this.selected.has(select.object) ?
                        this.selected.delete(select.object) :
                        this.selected.add(select.object);
                } else {
                    select.object.selected = true;
                    this.selected.add(select.object);
                }

                if (select.object.selected) {
                    Events.invoke(select.object, 'selecton', event);
                } else {
                    Events.invoke(select.object, 'selectoff', event);
                }
            } else {
                if (!event.shiftKey) {
                    this.clearSelected();
                }
            }
        }, 1);
        this.add('mouseup', (event) => {
            this.pressed = false;
            this.selected.forEach(object => {
                if (object.moving) {
                    Events.invoke(object, 'moveoff', event);
                }
                object.moving = false;
            });
        }, 1);
        this.add('mousemove', (event) => {
            if (this.lastMouseMove === undefined) {
                this.lastMouseMove = new Point(event.clientX, event.clientY);
            }

            if (this.pressed) {
                this.selected.forEach(object => {
                    if (!object.moving) {
                        Events.invoke(object, 'moveon', event);
                    }

                    object.moving = true;
                    Events.invoke(object, 'move', event.clientX - this.lastMouseMove.getX(), event.clientY - this.lastMouseMove.getY(), event);
                });
            }

            this.lastMouseMove.set(event.clientX, event.clientY);
        }, 1);

        // click
        
        this.clicking = true;

        this.add('mouseup', (event) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== this.canvas || !this.clicking) {
                return;
            }

            if (!event.shiftKey) {
                let click = this.objects.filter(({ object }) => object.collision(event.clientX, event.clientY))
                                    .sort((a, b) => b.index - a.index)[0];
                if (click !== undefined && !click.object.moving) {
                    Events.invoke(click.object, 'click', event);
                }
            }
        }, 0);

        // hover 

        this.hovering = true;

        this.add('mousemove', (event) => {
            if (this.hovering) {
                this.objects.forEach(({ object, index }) => {
                    let inside = object.collision(event.clientX, event.clientY);
                    if (object.hovered === undefined) {
                        object.hovered = false;
                    }
                    if (inside !== object.hovered) {
                        object.hovered = inside;
                        if (inside) {
                            Events.invoke(object, 'hoveron', event);
                        } else {
                            Events.invoke(object, 'hoveroff', event);
                        }
                    }
                });
            }
        }, 0);

        // mousedown/mouseup

        this.mousedownup = true;

        this.add('mousedown', (event) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== this.canvas || !this.mousedownup) {
                return;
            }

            this.objects.forEach(({ object, index }) => {
                if (object.collision(event.clientX, event.clientY)) {
                    Events.invoke(object, 'mousedown', event);
                    object.pressed = true;
                }
            });
        }, 0);
        this.add('mouseup', (event) => {
            this.objects.forEach(({ object, index }) => {
                if (object.pressed) {
                    Events.invoke(object, 'mouseup', event);
                    object.pressed = false;
                }
            });
        }, 0);
    }

    static invoke(object, method, ...args) {
        if (object[method] !== undefined) {
            object[method](...args);
        }
    }

    add(event, listener, priority) {
        this[event + 'Listeners'].push({ listener: listener, priority: priority });
        this[event + 'Listeners'] = this[event + 'Listeners'].sort((a, b) => a.priority - b.priority);
    }

    notice(object, index) {
        this.objects.push({ object: object, index: index });
    }

    deleteObject(obj) {
        this.objects = this.objects.filter(({ object }) => object !== obj);
    }

    deleteObjects(objects) {
        let result = [ ];
        objects.forEach(obj => {
            if (this.objects.find(e => e === obj) === undefined) {
                result.push(result);
            }
        });
        this.objects = result;
    }

    // other

    clearSelected() {
        this.selected.forEach(e => e.selected = false);
        this.selected.clear();
    }
}


// =========== network =========== 

class Component {
    constructor(pos, size, style) {
        this.pos   = pos;
        this.size  = size;
        this.style = style;
        
        this.state = false;
        
        this.input  = new Socket(this, 'input');
        this.output = new Socket(this, 'output');

        this.animate = true;
        this.hover   = {
            visible: false,
            size:    new NumberAnimate(0, (time) => time)
        };

        this.opacity = new NumberAnimate(0, Times.linear);
        this.frame   = () => { };
    }

    // evaluate

    reset() {
        this.state = false;
    }

    evaluate(args, time) {

    }

    // events

    move(dx, dy, event) {
        this.pos.move(dx, dy);
    }

    click(event) {
        
    }

    hoveron(event) {
        this.hover.size.to({
            value:    4,
            duration: 200,
            pre:      () => this.hover.visible = true
        });
    }

    hoveroff(event) {
        this.hover.size.to({
            value:    0,
            duration: 200,
            post:     () => this.hover.visible = false
        })
    }

    // predicate

    collision(x, y) {
        return Math.abs(x - this.pos.getX()) <= this.size / 2 &&
                Math.abs(y - this.pos.getY()) <= this.size / 2;
    }

    // draw

    draw(ctx, time) {
        this.drawDefault(ctx, time);
        if (this.hover.visible) {
            this.drawHover(ctx, time);
        }
        if (this.selected) {
            this.drawSelect(ctx, time);
        }
        if (!this.animate) {
            if (this.input !== undefined) {
                this.input.draw(ctx, time);
            }
            if (this.output !== undefined) {
                this.output.draw(ctx, time);
            }
        }
    }

    drawDefault(ctx, time) {
        if (!this.animate) {
            if (this.state) {
                drawOnComponent({
                    ctx:       ctx, 
                    pos:       this.pos,
                    size:      this.size,
                    lineWidth: 2,
                    lineCount: 10,
                    colors:    this.style.enable,
                    icon:      (ctx) => this.style.icon(this.pos, '#ffffff', ctx)
                });
            } else {
                drawOffComponent({
                    ctx:       ctx,
                    pos:       this.pos,
                    size:      this.size,
                    lineWidth: 2,
                    colors:    this.style.disable,
                    icon:      (ctx) => this.style.icon(this.pos, '#ffffff', ctx)
                });
            }

            drawText({
                ctx:      ctx,
                pos:      new Point(this.pos.getX(), this.pos.getY() + this.size / 2 + 15),
                text:     this.style.text,
                fontSize: '16px',
                color:    'rgba(255, 255, 255, 0.25)'
            });
        } else {
            ctx.globalAlpha = this.opacity.get();
            this.frame(ctx);
            ctx.globalAlpha = 1;
        }

        
    }

    drawSelect(ctx, time) {
        drawCircle(ctx, this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, 6, '#386AD7');
        drawCircle(ctx, this.pos.getX() - this.size / 2, this.pos.getY() + this.size / 2, 6, '#386AD7');
        drawCircle(ctx, this.pos.getX() + this.size / 2, this.pos.getY() - this.size / 2, 6, '#386AD7');
        drawCircle(ctx, this.pos.getX() + this.size / 2, this.pos.getY() + this.size / 2, 6, '#386AD7');

        ctx.strokeStyle = '#386AD7';
        ctx.strokeRect(this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, this.size, this.size);
    }

    drawHover(ctx, time) {
        drawCircle(ctx, this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, this.hover.size.get(), '#386AD7');
        drawCircle(ctx, this.pos.getX() - this.size / 2, this.pos.getY() + this.size / 2, this.hover.size.get(), '#386AD7');
        drawCircle(ctx, this.pos.getX() + this.size / 2, this.pos.getY() - this.size / 2, this.hover.size.get(), '#386AD7');
        drawCircle(ctx, this.pos.getX() + this.size / 2, this.pos.getY() + this.size / 2, this.hover.size.get(), '#386AD7');
    }

    // animate

    appearance(duration) {
        this.opacity.set(0);
        this.opacity.to({
            value:    1,
            duration: 500
        });
        animateFrames({
            wait:     0,
            duration: duration || 400,
            timing:   Times.linear,
            frames: [
                () => this.frame = (ctx) => drawEmptyBlock({
                        ctx:  ctx,
                        pos:  this.pos,
                        size: this.size,
                        color: this.style.disable.color200
                    }),
                () => this.frame = (ctx) => drawLinesBlock({
                        ctx:  ctx,
                        pos:  this.pos,
                        size: this.size,
                        lineWidth: 2,
                        lineCount: 10,
                        color: this.style.disable.color200
                    }),
                () => this.frame = (ctx) => drawFillBlock({
                        ctx:  ctx,
                        pos:  this.pos,
                        size: this.size,
                        color: this.style.disable.color200,
                        icon: () => this.style.icon(this.pos, '#050505', ctx)
                    })
            ],
            pre:  () => {
                this.animate = true;
                this.frame   = () => { };
            },
            post: () => this.animate = false
        });
    }
}

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
            this.tick = animate({
                wait:     Gate.TICK,
                duration: 2,
                timing:   (time) => time,
                callback: (time) => {  },

                post: () => {
                    this.state = true;
                    this.tick  = undefined;
                }
            });
        } else {
            this.tick = animate({
                wait:     Gate.TICK,
                duration: 2,
                timing:   (time) => time,
                callback: (time) => {  },
                
                post: () => {
                    this.state = false;
                    this.tick  = undefined;
                }
            });
        }
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
}

class Generator extends Component {
    static DEFAULT_SIZE = 70;

    constructor(pos) {
        super(pos, Generator.DEFAULT_SIZE, {
            text: 'switch',
            icon: () => { },
            disable: { color100: '#050505', color200: '#444444', color300: '#828282' },
            enable:  { color100: '#EEDC5E', color200: '#6B632B', color300: '#EEDC5E' }
        });
        this.input = undefined;
    }
}

class Socket {
    static DEFAULT_SIZE = 12;
    static HOVER_SIZE   = 18; 

    constructor(component, type) {
        this.pos  = new FollowPoint(component.pos, (type === 'input' ? -1 : 1) * component.size / 2, 0);
        this.size = new NumberAnimate(Socket.DEFAULT_SIZE, (time) => time);

        this.component = component;
        this.type      = type;
    }

    // events

    hoveron(event) {
        this.size.to({
            value:    Socket.HOVER_SIZE,
            duration: 200
        });
    }

    hoveroff(event) {
        this.size.to({
            value:    Socket.DEFAULT_SIZE,
            duration: 200
        });
    }

    // predicate

    collision(x, y) {
        let dx = x - this.pos.getX();
        let dy = y - this.pos.getY();

        return dx * dx + dy * dy <= this.size.get() * this.size.get(); 
    }

    // draw

    draw(ctx, time) {
        let color = this.component.state ? 
            this.component.style.enable.color300 :
            this.component.style.disable.color300;
        drawCircle(ctx, this.pos.getX(), this.pos.getY(), this.size.get() / 2, color);
    }
}

class Pipe {
    constructor(compstart, compend, start, end) {
        this.compstart = compstart;
        this.compend   = compend;
        this.start     = start;
        this.end       = end;

        this.state = compstart !== undefined ? compstart.state : false;

        this.route   = [ ];
        this.animate = {
            visible: false,
            value:   new NumberAnimate(0, Times.ease)
        };
    }

    // predicate

    collision(x, y) {
        let max = new Point(-Infinity, -Infinity);
        let min = new Point(Infinity, Infinity);
        for (const point of this.route) {
            max.set(Math.max(max.getX(), point.getX()), Math.max(max.getY(), point.getY()));
            min.set(Math.min(min.getX(), point.getX()), Math.min(min.getY(), point.getY()));
        }

        return min.getX() < x + 15 && x - 15 < max.getX() &&
                min.getY() < y + 15 && y - 15 < max.getY();
    }

    // draw

    prepareDraw(time) {
        if (this.compstart !== undefined) {
            this.state = this.compstart.state;
        }

        if (this.start.getX() + 50 < this.end.getX()) {
            if (Math.abs(this.start.getY() - this.end.getY()) < 10e-5) {
                this.route = [
                    this.start,
                    this.end
                ];
            } else {
                this.route = [
                    this.start,
                    new Point((this.start.getX() + this.end.getX()) / 2, this.start.getY()),
                    new Point((this.start.getX() + this.end.getX()) / 2, this.end.getY()),
                    this.end
                ];
            }
        } else {
            this.route = [
                this.start,
                new Point(this.start.getX() + 25, this.start.getY()),
                new Point(this.start.getX() + 25, (this.start.getY() + this.end.getY()) / 2),
                new Point(this.end.getX()   - 25, (this.start.getY() + this.end.getY()) / 2),
                new Point(this.end.getX()   - 25, this.end.getY()),
                this.end
            ];
        }
    }

    drawLine(ctx, time) {
        if (this.animate.visible) {
            let index = Math.trunc(this.animate.value.get());
            let value = this.animate.value.get() % 1;

            // console.log(Math.trunc(this.animate.value.get()));

            ctx.beginPath();
            ctx.moveTo(this.route[0].getX(), this.route[0].getY());
            for (let i = 1; i <= index; ++i) {
                ctx.lineTo(this.route[i].getX(), this.route[i].getY());
            }

            let delta_x = this.route[index + 1].getX() - this.route[index].getX();
            let delta_y = this.route[index + 1].getY() - this.route[index].getY();

            ctx.lineTo(
                this.route[index].getX() + value * delta_x,
                this.route[index].getY() + value * delta_y
            );
        } else {
            ctx.beginPath();
            ctx.moveTo(this.route[0].getX(), this.route[0].getY());
            for (let i = 1; i < this.route.length; ++i) {
                ctx.lineTo(this.route[i].getX(), this.route[i].getY());
            }
        }

        if (!this.state) {
            ctx.lineWidth   = 2;
            ctx.strokeStyle = '#050505';
            ctx.stroke();

            ctx.lineWidth   = 2;
            ctx.strokeStyle = '#444444';
            ctx.setLineDash([ 10, 5 ]);
            ctx.stroke();
            ctx.setLineDash([ ]);
        } else {
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.compstart.style.enable.color200;
            ctx.stroke();
        }
    }

    drawPoints(ctx, time) {
        let length = this.animate.visible ? Math.trunc(this.animate.value.get()) : this.route.length - 1;

        let color = this.state ? this.compstart.style.enable.color200 : '#444444';
        for (let i = 1; i <= length; ++i) {
            drawCircle(ctx, this.route[i].getX(), this.route[i].getY(), 6, color);
            drawCircle(ctx, this.route[i].getX(), this.route[i].getY(), 4, '#050505');
        }
    }

    // animate 

    appearance(duration) {
        this.animate.value.set(0);
        this.animate.value.to({
            value:    (this.route.length - 1),
            duration: duration || 800,
            pre:  () => this.animate.visible = true,
            post: () => this.animate.visible = false
        });
    }
}

class Network {
    static TICK = 100;

    constructor(events) {
        this.components = [ ];
        this.pipes      = [ ];
        this.sockets    = [ ];

        this.connections = new Map();

        this.pipe  = undefined;
        this.start = undefined;

        this.lastTick = performance.now();

        this.events = events;
        events.add('mousemove', (event) => {
            if (this.pipe !== undefined) { 
                let x = event.clientX;
                let y = event.clientY;

                if (this.pipe.end instanceof FollowPoint) {
                    this.pipe.start.set(x, y);
                } else {
                    this.pipe.end.set(x, y);
                }
            }
        });
    }

    // eval

    evaluate(time) {
        let evals = new Set();
        const next = (component) => {
            if (!evals.has(component)) {
                evals.add(component);

                let connect = this.connections.get(component);
                if (connect !== undefined) {
                    component.evaluate([...connect].map(e => next(e).state), time);
                }
            }

            return component;
        };
        this.components.filter(e => e instanceof Lamp).forEach(lamp => next(lamp));
        this.components.filter(e => e instanceof Gate).forEach(gate => next(gate));
    }

    // add elements

    pushGate(pos, expr, style) {
        let gate = new Gate(pos, expr, style);

        this.setSocketEvent(gate.input);
        this.setSocketEvent(gate.output);
        this.events.notice(gate, 0);
        this.events.notice(gate.input, 1);
        this.events.notice(gate.output, 1);


        this.components.push(gate);
        this.sockets.push(gate.input, gate.output);

        return gate;
    }

    pushLamp(pos) {
        let lamp = new Lamp(pos);

        this.setSocketEvent(lamp.input);
        this.events.notice(lamp, 0);
        this.events.notice(lamp.input, 1);
        
        this.components.push(lamp);
        this.sockets.push(lamp.input);

        return lamp;
    }


    pushSwitch(pos) {
        let swtch = new Switch(pos);

        this.setSocketEvent(swtch.output);
        this.events.notice(swtch, 0);
        this.events.notice(swtch.output, 1);

        this.components.push(swtch);
        this.sockets.push(swtch.output);

        return swtch;
    }

    // save/load

    getMap() {
        
    }

    setMap(map) {
        
    }

    // operation

    addComponent(component) {
        this.components.push(component);
        this.events.notice(component, 0);

        if (component.input !== undefined) {
            this.sockets.push(component.input);
            this.setSocketEvent(component.input);
            this.events.notice(component.input, 1);
        }
        if (component.output !== undefined) {
            this.sockets.push(component.output);
            this.setSocketEvent(component.output);
            this.events.notice(component.output, 1);
        }
    }

    addComponents(components) {
        components.forEach(component => this.addComponent(component));
    }

    deleteComponent(component) {
        this.components = this.components.filter(element => element !== component);
        this.sockets = this.sockets.filter(element => element.component !== component);
        this.pipes = this.pipes.filter(element => element.compstart !== component && element.compend !== component);

        this.connections.delete(component);
        for (const [key, value] of this.connections) {
            value.delete(component);
        }

        this.events.deleteObject(component);
        this.events.deleteObject(component.input);
        this.events.deleteObject(component.output);
    }

    deleteComponents(components) {
        components.forEach(component => this.deleteComponent(component));
    }

    // pipeline
    
    setSocketEvent(socket) {
        socket.mousedown = (event) => {
            this.pipe = socket.type === 'input' ?
                                new Pipe(undefined, socket.component, new Point(event.clientX, event.clientY), socket.pos) :
                                new Pipe(socket.component, undefined, socket.pos, new Point(event.clientX, event.clientY));
            this.start = socket;
        };
        socket.mouseup = (event) => {
            let finded = this.sockets.find(e => e.collision(event.clientX, event.clientY));
            if (finded !== undefined && socket.type !== finded.type) {
                if (socket.type === 'output') {
                    this.linkingComponents(socket, finded);
                } else {
                    this.linkingComponents(finded, socket);
                }
            }

            this.pipe  = undefined;  
            this.start = undefined;
        };
    }

    linkingComponents(output, input) {
        if (output.component !== input.component) {
            let possible = true;
            let connection = this.connections.get(input.component);
            if (connection === undefined) {
                this.connections.set(input.component, new Set([ output.component ]));
            } else {
                possible = !connection.has(output.component);
                if (possible) {
                    connection.add(output.component);
                }
            }
    
            if (possible) {
                this.pipes.push(new Pipe(output.component, input.component, output.pos, input.pos));
            }
        }
    }

    // draw

    tick(time) {
        // if (time - this.lastTick > Network.TICK) {
            this.evaluate(time);
            // this.lastTick = time;
        // }
    }

    draw(ctx, time) {
        let pipes = this.pipe === undefined ? this.pipes : [this.pipe, ...this.pipes];
        pipes.forEach(pipe => pipe.prepareDraw(time));
        pipes = pipes.sort((a, b) => a.state - b.state);

        pipes.forEach(pipe => pipe.drawLine(ctx, time));
        pipes.forEach(pipe => pipe.drawPoints(ctx, time));

        this.components.forEach(e => e.draw(ctx, time));
    }

    appearance() {
        this.components.forEach(component => setTimeout(() => component.appearance(), Math.random() * 200 + 50));
        this.pipes.forEach(pipe => setTimeout(() => pipe.appearance(Math.random() * 300 + 700), Math.random() * 200 + 50));
    }
}

const AND_STYLE = {
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
};

const OR_STYLE = {
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
};

const NOT_STYLE = {
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
}

class NodeEngine {
    constructor(ctx, canvas) {
        this.ctx    = ctx;
        this.canvas = canvas;

        this.events  = new Events(canvas);
        this.network = new Network(this.events);

        this.select = {
            visible: false,
            start:   new Point(0, 0),
            end:     new Point(0, 0)  
        };

        this.events.add('mousedown', (event) => {
            let object = this.events.objects.find(({ object }) => object.collision(event.clientX, event.clientY));
            if (object === undefined) {
                this.select.visible = true;
                this.select.start.set(event.clientX, event.clientY);
                this.select.end.set(event.clientX, event.clientY);
            }
        }, 0);
        this.events.add('mouseup', (event) => {
            if (this.select.visible) {
                this.select.visible = false;
            }
        }, 0);
        this.events.add('mousemove', (event) => {
            if (this.select.visible) {
                this.select.end.set(event.clientX, event.clientY);
            }
        }, 0);

        this.network.pushGate(new Point(300, 300), (args) => !args.reduce((a, b) => a || b), NOT_STYLE);
        this.network.pushGate(new Point(100, 500), (args) => args.reduce((a, b) => a && b), AND_STYLE);
        this.network.pushGate(new Point(300, 500), (args) => args.reduce((a, b) => a || b), OR_STYLE);
        this.network.pushGate(new Point(500, 300), (args) => args.reduce((a, b) => a || b), OR_STYLE);
        this.network.pushSwitch(new Point(100, 300));
        this.network.pushSwitch(new Point(500, 500));

        this.evaluate = true;
        this.running  = false;
    }

    setEvaluate(value) {
        this.evaluate = value;
    }

    launch() {
        this.running = true;

        const frame = (time) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.network.tick(time);
            this.network.draw(this.ctx, time);

            if (this.select.visible) {
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#386AD7';
                this.ctx.setLineDash([ 10, 5 ]);
                this.ctx.strokeRect(
                    this.select.start.getX(), this.select.start.getY(),
                    this.select.end.getX() - this.select.start.getX(),
                    this.select.end.getY() - this.select.start.getY()
                );
                this.ctx.setLineDash([ ]);

                this.ctx.fillStyle = '#386ad715';
                this.ctx.fillRect(
                    this.select.start.getX(), this.select.start.getY(),
                    this.select.end.getX() - this.select.start.getX(),
                    this.select.end.getY() - this.select.start.getY()
                );
            }
            
    
            if (this.running) {
                requestAnimationFrame(frame);
            }
        };

        requestAnimationFrame(frame);
    }
}