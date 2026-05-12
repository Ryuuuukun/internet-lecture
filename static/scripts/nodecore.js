// --------------- math ---------------

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

// --------------- animate ---------------

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
                if (post !== undefined) {
                    post();
                }
            }
        });
    }, wait || 0);
    
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

class NumberAnimate {
    constructor(init) {
        this.value  = init;
        this.holder = undefined;
    }
    
    to({ value, wait, duration, timing, pre, post }) {
        if (this.holder !== undefined) {
            this.holder.quit();
        }
        
        let start = this.value;
        let delta = value - this.value;
        this.holder = animate({
            wait:     wait || 0,
            duration: duration,
            timing:   timing || Times.linear,
            callback: (time) => this.value = start + delta * time,
            pre: pre,
            post: () => {
                this.holder = undefined;
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

const Times = {
    linear: (time) => time,
    ease:   (time) => time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time,
    smooth: (time) => 0.5 * Math.cos(Math.PI * (time - 1)) + 0.5
}

// --------------- wrapping ---------------

function WrapContext(ctx) {
    ctx.line = function(x1, y1, x2, y2) {
        this.beginPath();
        ctx.moveTo(Math.floor(x1), Math.floor(y1));
        ctx.lineTo(Math.floor(x2), Math.floor(y2));
        this.stroke();
    };
    ctx.circle = function(x, y, radius) {
        this.beginPath();
        this.arc(x, y, Math.abs(radius), 0, 2 * Math.PI);
        this.fill();
    };
    ctx.text = function({ pos, text, fontSize, color }) {
        this.font         = `${fontSize} 'JetBrains Mono'`;
        this.fillStyle    = color;
        this.textAlign    = 'center'; 
        this.textBaseline = 'middle'; 
        this.fillText(text, pos.getX(), pos.getY());
    };
    ctx.infcanvas = function({ startX, startY, width, height, spacing, radius, color }) {
        for (let x = startX; x < width; x += spacing) {
            for (let y = startY; y < height; y += spacing) {
                ctx.fillStyle = color;
                ctx.circle(x, y, radius);
            }
        }
    };
    ctx.emptyblock = function({ pos, size, lineWidth, color }) {
        this.lineWidth   = lineWidth;
        this.strokeStyle = color;
        this.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        this.line(pos.getX() - size / 2, pos.getY() - size / 2, pos.getX() + size / 2, pos.getY() + size / 2);
        this.line(pos.getX() - size / 2, pos.getY() + size / 2, pos.getX() + size / 2, pos.getY() - size / 2)
    }
    ctx.linesblock = function({ pos, size, lineWidth, lineCount, color }) {
        this.lineWidth   = lineWidth;
        this.strokeStyle = color;

        this.beginPath();
        for (let i = 0; i < lineCount; ++i) {
            ctx.moveTo(pos.getX() - size / 2, pos.getY() - size / 2 + i * (size / lineCount));
            ctx.lineTo(pos.getX() - size / 2 + i * (size / lineCount), pos.getY() - size / 2);
        }
        for (let i = 0; i < lineCount; ++i) {
            ctx.moveTo(pos.getX() - size / 2 + i * (size / lineCount), pos.getY() + size / 2);
            ctx.lineTo(pos.getX() + size / 2, pos.getY() - size / 2 + i * (size / lineCount));
        }
        this.stroke();
    };
    ctx.fillblock = function({ pos, size, icon, color }) {
        this.fillStyle = color;
        this.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        if (icon !== undefined) {
            icon(this);
        }
    };
    ctx.offcomponent = function({ pos, size, lineWidth, icon, colors }) {
        this.fillStyle = colors.color100;
        this.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        
        this.lineWidth   = lineWidth;
        this.strokeStyle = colors.color200;
        this.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        
        this.fillStyle = colors.color300;
        this.circle(pos.getX() - size / 2, pos.getY() - size / 2, 4);
        this.circle(pos.getX() - size / 2, pos.getY() + size / 2, 4);
        this.circle(pos.getX() + size / 2, pos.getY() - size / 2, 4);
        this.circle(pos.getX() + size / 2, pos.getY() + size / 2, 4);
        if (icon !== undefined) {
            icon(this);
        }
    };
    ctx.oncomponent = function({ pos, size, lineWidth, lineCount, icon, colors }) {
        this.shadowColor = `${colors.color300}${Math.floor(255 * 0.20).toString(16)}`; 
        this.shadowBlur  = 50;     
        
        this.fillStyle = colors.color100;
        this.fillRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        
        this.linesblock({ pos: pos, size: size, lineWidth: lineWidth, lineCount: lineCount, color: colors.color200 });
        
        this.lineWidth   = lineWidth;
        this.strokeStyle = colors.color200;
        this.strokeRect(pos.getX() - size / 2, pos.getY() - size / 2, size, size);
        if (icon !== undefined) {
            icon(this);
        }
        
        this.shadowBlur = 0;
    }
    
    return ctx;
}

function WrapCanvas(canvas) {
    canvas.transform = {
        dragging: false,
        start:  new Point(0, 0),
        offset: new Point(0, 0),
        scale:  1,
        zoom:   new ValueProxy(1)
    };
    canvas.getMarginX = function() {
        return this.getBoundingClientRect().left;
    };
    canvas.getMarginY = function() {
        return this.getBoundingClientRect().top;
    };
    canvas.getOffsetX = function() {
        return this.transform.offset.getX();
    };
    canvas.getOffsetY = function() {
        return this.transform.offset.getY();
    };

    canvas.setScale = function(value) {
        this.transform.scale = value;
    };
    canvas.getScale = function() {
        return this.transform.scale;
    };
    
    canvas.getZoomValue = function() {
        return this.transform.zoom.get();
    };
    canvas.setZoomValue = function(value) {
        this.transform.zoom.set(value);
    };
    canvas.getZoom = function() {
        return this.transform.zoom;
    };

    canvas.getGlobalScale = function() {
        return this.getZoomValue() * this.getScale();
    }


    return canvas;
}

// --------------- utility ---------------

class ValueProxy {
    constructor(value) {
        this.value = value;
        this.listeners = new Set();
    }

    add(listener) {
        this.listeners.add(listener);
    }

    delete(listener) {
        this.listeners.delete(listener);
    }

    set(value) {
        if (this.value !== value) {
            this.listeners.forEach((listener) => listener(value, this.value));
            this.value = value;
        }
    }

    get(value) {
        return this.value;
    }
}


// --------------- events ---------------

class Events {
    constructor(canvas) {
        this.mousemoveListeners = [];
        this.mousedownListeners = [];
        this.mouseupListeners   = [];
        this.keydownListeners   = [];

        document.addEventListener('mousemove', (event) => {
            this.mousemoveListeners.forEach(({ listener }) => listener(event, canvas));
        });
        document.addEventListener('mousedown', (event) => {
            this.mousedownListeners.forEach(({ listener }) => listener(event, canvas));
        });
        document.addEventListener('mouseup', (event) => {
            this.mouseupListeners.forEach(({ listener }) => listener(event, canvas));
        });
        document.addEventListener('keydown', (event) => {
            this.keydownListeners.forEach(({ listener }) => listener(event, canvas));
        });
    }

    add(event, listener, priority) {
        let id = crypto.randomUUID();
        this[event + 'Listeners'].push({ id: id, listener: listener, priority: priority });
        this[event + 'Listeners'] = this[event + 'Listeners'].sort((a, b) => a.priority - b.priority);
        
        return id;
    }

    delete(id) {
        this[event + 'Listeners'] = this[event + 'Listeners'].filter((listener) => listener.id !== id);
    }
}

class ObjectEvents {
    constructor(events) {
        this.objects = new Map();

        // select

        this.selection = true;

        this.selected = new Set();
        this.pressed  = false;
        this.lastMouseMove = undefined;

        events.add('mousedown', (event, canvas) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== canvas || !this.selection || event.button !== 0) {
                return;
            }

            this.pressed = true;

            let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
            let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

            let select = [...this.objects.values()].filter(({ object }) => object.collision(x, y, canvas.getGlobalScale())).sort((a, b) => b.index - a.index)[0];
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
                    ObjectEvents.invoke(select.object, 'selecton', event, canvas);
                } else {
                    ObjectEvents.invoke(select.object, 'selectoff', event, canvas);
                }
            } else {
                if (!event.shiftKey) {
                    this.clearSelected();
                }
            }
        }, 1);
        events.add('mouseup', (event, canvas) => {
            this.pressed = false;
            this.selected.forEach((object) => {
                if (object.moving) {
                    ObjectEvents.invoke(object, 'moveoff', event, canvas);
                }
                object.moving = false;
            });
        }, 1);
        events.add('mousemove', (event, canvas) => {
            if (this.lastMouseMove === undefined) {
                this.lastMouseMove = new Point(event.clientX, event.clientY);
            }

            if (this.pressed) {
                let dx = (event.clientX - this.lastMouseMove.getX()) / canvas.getGlobalScale();
                let dy = (event.clientY - this.lastMouseMove.getY()) / canvas.getGlobalScale();

                this.selected.forEach(object => {
                    if (!object.moving) {
                        ObjectEvents.invoke(object, 'moveon', event, canvas);
                    }

                    object.moving = true;
                    ObjectEvents.invoke(object, 'move', dx, dy, event, canvas);
                });
            }

            this.lastMouseMove.set(event.clientX, event.clientY);
        }, 1);

        // click

        this.clicking = true;

        events.add('mouseup', (event, canvas) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== canvas || !this.clicking || event.button !== 0) {
                return;
            }

            if (!event.shiftKey) {
                let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
                let y = event.clientY - canvas.getMarginX() - canvas.getOffsetY();

                let click = [...this.objects.values()].filter(({ object }) => object.collision(x, y, canvas.getGlobalScale())).sort((a, b) => b.index - a.index)[0];
                if (click !== undefined && !click.object.moving) {
                    ObjectEvents.invoke(click.object, 'click', event, canvas);
                }
            }
        }, 0);
        
        // hover

        this.hovering = true;

        events.add('mousemove', (event, canvas) => {
            if (this.hovering) {
                let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
                let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

                this.objects.values().forEach(({ object, index }) => {
                    let inside = object.collision(x, y, canvas.getGlobalScale());
                    if (object.hovered === undefined) {
                        object.hovered = false;
                    }
                    if (inside !== object.hovered) {
                        object.hovered = inside;
                        if (inside) {
                            ObjectEvents.invoke(object, 'hoveron', event, canvas);
                        } else {
                            ObjectEvents.invoke(object, 'hoveroff', event, canvas);
                        }
                    }
                });
            }
        }, 0);

        // mousedown/mouseup

        this.mousedownup = true;

        events.add('mousedown', (event, canvas) => {
            if (document.elementFromPoint(event.clientX, event.clientY) !== canvas || !this.mousedownup || event.button !== 0) {
                return;
            }

            let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
            let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

            this.objects.values().forEach(({ object, index }) => {
                if (object.collision(x, y, canvas.getGlobalScale())) {
                    ObjectEvents.invoke(object, 'mousedown', event, canvas);
                    object.pressed = true;
                }
            });
        }, 0);
        events.add('mouseup', (event, canvas) => {
            this.objects.values().forEach(({ object, index }) => {
                if (object.pressed) {
                    ObjectEvents.invoke(object, 'mouseup', event, canvas);
                    object.pressed = false;
                }
            });
        }, 0);
    }

    // utility

    static invoke(object, method, ...args) {
        if (object[method] !== undefined) {
            object[method](...args);
        }
    }

    // operation

    add(...args) {
        args.forEach((arg) => {
            if (arg !== undefined) {
                this.objects.set(arg.object.id, { object: arg.object, index: arg.index });
            }
        });
    }

    delete(...args) {
        args.forEach((arg) => {
            if (arg !== undefined) {
                this.objects.delete(arg.id);
            }
        });
    }

    // other

    clearSelected() {
        this.selected.forEach(e => e.selected = false);
        this.selected.clear();
    }
}

// --------------- network ---------------

class Component {
    constructor(pos, size, style) {
        this.id    = crypto.randomUUID();
        this.pos   = pos;
        this.size  = size;
        this.style = style;

        this.state = false;

        this.input  = new Socket(this, 'input');
        this.output = new Socket(this, 'output');

        this.animate = {
            visible: false,
            opacity: new NumberAnimate(0),
            frame:   () => { }
        };
        this.hover = {
            visible: false,
            size:    new NumberAnimate(0)
        };
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
            pre: () => this.hover.visible = true
        });
    }
    
    hoveroff(event) {
        this.hover.size.to({
            value:    0,
            duration: 200,
            post: () => this.hover.visible = false
        });
    }

    // predicate

    collision(x, y, zoom) {
        return Math.abs(x - this.pos.getX() * zoom) <= this.size * zoom / 2 &&
                Math.abs(y - this.pos.getY() * zoom) <= this.size * zoom / 2;
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
        if (!this.animate.visible) {
            if (this.input !== undefined) {
                this.input.draw(ctx, time);
            }
            if (this.output !== undefined) {
                this.output.draw(ctx, time);
            }
        }
    }

    drawDefault(ctx, time) {
        if (!this.animate.visible) {
            if (this.state) {
                ctx.oncomponent({
                    pos:  this.pos,
                    size: this.size,
                    lineWidth: 2,
                    lineCount: 10,
                    colors:    this.style.enable,
                    icon:      (ctx) => this.style.icon(this.pos, '#ffffff', ctx)
                });
            } else {
                ctx.offcomponent({
                    pos:  this.pos,
                    size: this.size,
                    lineWidth: 2,
                    colors:    this.style.disable,
                    icon:      (ctx) => this.style.icon(this.pos, '#ffffff', ctx)
                });
            }

            ctx.text({
                pos:      new Point(this.pos.getX(), this.pos.getY() + this.size / 2 + 15),
                text:     this.style.text,
                fontSize: '16px',
                color:    'rgba(255, 255, 255, 0.25)'
            });
        } else {
            ctx.globalAlpha = this.animate.opacity.get();
            this.animate.frame(ctx, time);
            ctx.globalAlpha = 1;
        }
    }

    drawSelect(ctx, time) {
        ctx.fillStyle = '#386AD7';
        ctx.circle(this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, 6);
        ctx.circle(this.pos.getX() - this.size / 2, this.pos.getY() + this.size / 2, 6);
        ctx.circle(this.pos.getX() + this.size / 2, this.pos.getY() - this.size / 2, 6);
        ctx.circle(this.pos.getX() + this.size / 2, this.pos.getY() + this.size / 2, 6);
        
        ctx.strokeStyle = '#386AD7';
        ctx.strokeRect(this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, this.size, this.size);
    }

    drawHover(ctx, time) {
        ctx.fillStyle = '#386AD7';
        ctx.circle(this.pos.getX() - this.size / 2, this.pos.getY() - this.size / 2, this.hover.size.get());
        ctx.circle(this.pos.getX() - this.size / 2, this.pos.getY() + this.size / 2, this.hover.size.get());
        ctx.circle(this.pos.getX() + this.size / 2, this.pos.getY() - this.size / 2, this.hover.size.get());
        ctx.circle(this.pos.getX() + this.size / 2, this.pos.getY() + this.size / 2, this.hover.size.get());
    }

    // animate

    appearance({ wait, duration }) {
        this.animate.opacity.set(0);
        this.animate.opacity.to({
            value:    1,
            duration: 600
        });
        animateFrames({
            wait:     wait || 0,
            duration: duration || 500,
            timing:   Times.linear,
            frames: [
                () => this.animate.frame = (ctx) => ctx.emptyblock({
                        pos:   this.pos,
                        size:  this.size,
                        color: this.style.disable.color200
                    }),
                () => this.animate.frame = (ctx) => ctx.linesblock({
                        pos:  this.pos,
                        size: this.size,
                        lineWidth: 2,
                        lineCount: 10,
                        color: this.style.disable.color200
                    }),
                () => this.animate.frame = (ctx) => ctx.fillblock({
                        pos:  this.pos,
                        size: this.size,
                        color: this.style.disable.color200,
                        icon: () => this.style.icon(this.pos, '#050505', ctx)
                    })
            ],
            pre: () => {
                this.animate.visible = true;
                this.frame = () => { };
            },
            post: () => this.animate.visible = false
        });
    }
}

class Socket {
    static DEFAULT_SIZE = 12;
    static HOVER_SIZE   = 18;
    
    constructor(component, type) {
        this.pos  = new FollowPoint(component.pos, (type === 'input' ? -1 : 1) * component.size / 2, 0);
        this.size = new NumberAnimate(Socket.DEFAULT_SIZE);
        
        this.id = crypto.randomUUID();
        this.component = component;
        this.type      = type;
    }

    // events

    hoveron(event) {
        this.size.to({
            value: Socket.HOVER_SIZE,
            duration: 200
        });
    }

    hoveroff(event) {
        this.size.to({
            value: Socket.DEFAULT_SIZE,
            duration: 200
        });
    }

    // predicate

    collision(x, y) {
        let dx = x - this.pos.getX();
        let dy = y - this.pos.getY();

        return dx * dx + dy * dy < this.size.get() * this.size.get();
    }

    // draw

    draw(ctx, time) {
        ctx.fillStyle = this.component.state ? 
            this.component.style.enable.color300 :
            this.component.style.disable.color300;
        ctx.circle(this.pos.getX(), this.pos.getY(), this.size.get() / 2);
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
            value:   new NumberAnimate(0)
        };
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
            ctx.fillStyle = color;
            ctx.circle(this.route[i].getX(), this.route[i].getY(), 6);
            ctx.fillStyle = '#050505';
            ctx.circle(this.route[i].getX(), this.route[i].getY(), 4);
        }
    }

    // animate

    appearance({ wait, duration }) {
        this.animate.value.set(0);
        this.animate.value.to({
            value:    (this.route.length - 1),
            wait:     wait || 0,
            duration: duration || 800,
            pre:  () => this.animate.visible = true,
            post: () => this.animate.visible = false
        });
    }
}

class Network {
    constructor(events, objectEvents) {
        this.events = events;
        this.objectEvents = objectEvents;

        this.components = [];
        this.pipes      = [];
        this.sockets    = [];

        this.connections = new Map();

        this.pipe  = undefined;
        this.start = undefined;

        events.add('mousemove', (event, canvas) => {
            if (this.pipe !== undefined) {
                let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
                let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

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

    // operation

    add(...args) {
        args.forEach((component) => {
            this.components.push(component);
            this.objectEvents.add({ object: component, index: 0 });

            if (component.input !== undefined) {
                this.objectEvents.add({ object: component.input, index: 1 });
                this.setSocketEvent(component.input);
                this.sockets.push(component.input);
            }
            if (component.output !== undefined) {
                this.objectEvents.add({ object: component.output, index: 1 });
                this.setSocketEvent(component.output);
                this.sockets.push(component.output);
            }
        });
    }

    delete(...args) {
        args.forEach((component) => {
            this.components = this.components.filter(element => element !== component);
            this.sockets = this.sockets.filter(element => element.component !== component);
            this.pipes = this.pipes.filter(element => element.compstart !== component && element.compend !== component);

            this.connections.delete(component);
            for (const [key, value] of this.connections) {
                value.delete(component);
            }

            this.objectEvents.delete(component);
            this.objectEvents.delete(component.input);
            this.objectEvents.delete(component.output);
        });
    }

    linking(start, end) {
        if (start !== end) {
            let possible = true;
            let connection = this.connections.get(end);
            if (connection === undefined) {
                this.connections.set(end, new Set([ start ]));
            } else {
                possible = !connection.has(start);
                if (possible) {
                    connection.add(start);
                }
            }

            if (possible) {
                this.pipes.push(new Pipe(start, end, start.output.pos, end.input.pos));
            }
        }
    }

    clear() {
        this.delete(...this.components);
    }

    // utility

    setSocketEvent(socket) {
        socket.mousedown = (event, canvas) => {
            let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
            let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

            this.pipe = socket.type === 'input' ?
                            new Pipe(undefined, socket.component, new Point(x, y), socket.pos) :
                            new Pipe(socket.component, undefined, socket.pos, new Point(x, y));
            this.start = socket;
        };
        socket.mouseup = (event, canvas) => {
            let x = event.clientX - canvas.getMarginX() - canvas.getOffsetX();
            let y = event.clientY - canvas.getMarginY() - canvas.getOffsetY();

            let finded = this.sockets.find(e => e.collision(x, y));
            if (finded !== undefined && socket.type !== finded.type) {
                if (socket.type === 'output') {
                    this.linking(socket.component, finded.component);
                } else {
                    this.linking(finded.component, socket.component);
                }
            }

            this.pipe  = undefined;  
            this.start = undefined;
        };
    }

    // tick

    tick(time) {
        this.evaluate(time);
    }

    draw(ctx, time) {
        let pipes = this.pipe === undefined ? this.pipes : [this.pipe, ...this.pipes];
        pipes.forEach(pipe => pipe.prepareDraw(time));
        pipes = pipes.sort((a, b) => a.state - b.state);

        pipes.forEach(pipe => pipe.drawLine(ctx, time));
        pipes.forEach(pipe => pipe.drawPoints(ctx, time));

        this.components.forEach((component) => component.draw(ctx, time));
    }

    // animate

    appearance() {
        const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        this.components.forEach(component => {
            component.appearance({
                wait:     random(10, 300),
                duration: random(500, 550)
            });
        });
        this.pipes.forEach((pipe) => {
            pipe.prepareDraw();
            pipe.appearance({
                wait:     random(300, 300),
                duration: random(800, 1000)
            });
        });
    }
}

// --------------- utility ---------------

function centermass(objects) {
    let x = 0;
    let y = 0;
    
    objects.forEach(({ pos }) => {
        x += pos.getX();
        y += pos.getY();
    });

    return new Point(x / objects.length, y / objects.length);
}

function findpoint(predicate, init, objects) {
    let x = init;
    let y = init;
    
    objects.forEach(({ pos }) => {
        x = predicate(x, pos.getX());
        y = predicate(y, pos.getY());
    });

    return new Point(x, y);
}

// --------------- engine ---------------

class NodeEngine {
    constructor(ctx, canvas) {
        this.ctx    = WrapContext(ctx);
        this.canvas = WrapCanvas(canvas);

        this.events  = new Events(this.canvas);
        this.objectEvents = new ObjectEvents(this.events); 
        this.network = new Network(this.events, this.objectEvents);

        this.running   = false;
        this.infcanvas = true;

        this.dragging = true;
        this.events.add('mousedown', (event) => {
            if (event.button === 1 && this.dragging) {
                this.canvas.transform.dragging = true;
                this.canvas.transform.start.set(
                    event.clientX - this.canvas.getOffsetX(),
                    event.clientY - this.canvas.getOffsetY()
                );
                this.canvas.style.cursor = 'grabbing';
            }
        });
        this.events.add('mouseup', (event) => {
            this.canvas.transform.dragging = false;
            this.canvas.style.cursor = 'default';
        });
        this.events.add('mousemove', (event) => {
            if (this.canvas.transform.dragging) {
                this.canvas.transform.offset.set(
                    event.clientX - this.canvas.transform.start.getX(),
                    event.clientY - this.canvas.transform.start.getY()
                );
            }
        });

        this.radar = {
            visible:      false,
            offset:       300,
            radiusGlobal: 30,
            radiusLocal:  10
        };

        this.events.add('mousedown', (event) => {
            let x = event.clientX - this.canvas.width / 2;
            let y = event.clientY - this.canvas.height / 2;
            if (this.radar.visible && x * x + y * y < this.radar.radiusGlobal * this.radar.radiusGlobal) {
                let center = centermass(this.network.components);

                let startX = this.canvas.getOffsetX();
                let startY = this.canvas.getOffsetY();

                let dx = this.canvas.width  / 2 - center.getX() - this.canvas.getOffsetX();
                let dy = this.canvas.height / 2 - center.getY() - this.canvas.getOffsetY();
                animate({
                    wait:     0,
                    duration: 500,
                    timing:   Times.smooth,
                    callback: (time) => {
                        this.canvas.transform.offset.set(
                            startX + dx * time,
                            startY + dy * time
                        );
                    }
                })
            }
        });
    }

    centerit() {
        let center = centermass(this.network.components);
        this.canvas.transform.offset.set(
            this.canvas.width  / 2 - center.getX() * this.canvas.getGlobalScale(),
            this.canvas.height / 2 - center.getY() * this.canvas.getGlobalScale()
        );
    }
    
    launch() {
        this.lasttime = performance.now();
        this.running = true;

        const frame = (time) => {
            this.ctx.resetTransform();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.infcanvas) {
                this.ctx.infcanvas({
                    startX: this.canvas.getOffsetX() % 80,
                    startY: this.canvas.getOffsetY() % 80,
                    width:  this.canvas.width,
                    height: this.canvas.height,
                    spacing: 80,
                    radius:  2,
                    color:  'rgba(255, 255, 255, 0.11)'
                });
                this.ctx.infcanvas({
                    startX: this.canvas.getOffsetX() % 20,
                    startY: this.canvas.getOffsetY() % 20,
                    width:  this.canvas.width,
                    height: this.canvas.height,
                    spacing: 20,
                    radius:  1,
                    color:  'rgba(255, 255, 255, 0.11)'
                });
            }

            if (this.network.components.length > 0) {
                let min = findpoint(Math.min, Infinity, this.network.components);
                let max = findpoint(Math.max, -Infinity, this.network.components);
                let center = centermass(this.network.components);

                min.x *= this.canvas.getGlobalScale();
                min.y *= this.canvas.getGlobalScale();
                max.x *= this.canvas.getGlobalScale();
                max.y *= this.canvas.getGlobalScale();
                center.x *= this.canvas.getGlobalScale();
                center.y *= this.canvas.getGlobalScale();
                
                
                if (
                    min.getX() + this.canvas.getOffsetX() + this.radar.offset > this.canvas.width  ||
                    min.getY() + this.canvas.getOffsetY() + this.radar.offset > this.canvas.height ||
                    max.getX() + this.canvas.getOffsetX() - this.radar.offset < 0 ||
                    max.getY() + this.canvas.getOffsetY() - this.radar.offset < 0
                ) {
                    let x = center.getX() + this.canvas.getOffsetX() - this.canvas.width / 2;
                    let y = center.getY() + this.canvas.getOffsetY() - this.canvas.height / 2;
                    
                    let len = Math.sqrt(x * x + y * y);
                    
                    x = x / len * this.radar.radiusGlobal;
                    y = y / len * this.radar.radiusGlobal;
                    
                    
                    this.ctx.strokeStyle = '#181818';
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 3;
                    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.radar.radiusGlobal, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = '#386AD7';
                    this.ctx.circle(x + this.canvas.width / 2, y + this.canvas.height / 2, this.radar.radiusLocal);  

                    this.radar.visible = true;
                } else {
                    this.radar.visible = false;
                }
            }

            this.ctx.translate(this.canvas.getOffsetX(), this.canvas.getOffsetY());
            this.ctx.scale(this.canvas.getGlobalScale(), this.canvas.getGlobalScale());

            this.network.tick(time);
            this.network.draw(this.ctx, time);
            
            if (this.running) {
                requestAnimationFrame(frame);
            }
        };

        requestAnimationFrame(frame);
    }

    stop() {
        this.running = false;
    }
}