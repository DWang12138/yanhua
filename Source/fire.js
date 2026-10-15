var canvas = document.getElementById("cas");
var ocas = document.createElement("canvas");
var octx = ocas.getContext("2d");
var ctx = canvas.getContext("2d");
ocas.width = canvas.width = window.innerWidth;
ocas.height = canvas.height = window.innerHeight;
var bigbooms = [];
var lastShapeX = null; // 上一次文字烟花的落点横坐标，用于避免文案重叠

// window.onload = function() {
//     initAnimate();
// };

function initAnimate() {
    drawBg();
    lastTime = new Date();
    animate()
}
var lastTime;
function animate() {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    // 【拖尾长度】数值越小，每帧擦除越慢，拖尾越长（当前 0.08；调大则拖尾变短）
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    var newTime = new Date();
    // 【烟花发射间隔】毫秒数越小、烟花越密集（当前基准 500）
    if (newTime - lastTime > 500 + (window.innerHeight - 767) / 2) {
        var random = Math.random() * 100 > 33 ? true: false;
        // 【性能】同时存在的文字烟花最多 3 个，超过则本轮改为普通烟花，避免文案堆叠卡顿
        var activeShapes = 0;
        for (var s = 0; s < bigbooms.length; s++) {
            if (bigbooms[s] && bigbooms[s].shape) activeShapes++;
        }
        if (activeShapes >= 3) random = true;
        // 【普通烟花绽放位置】横坐标范围占画布比例，越大分布越宽（当前 1/8 ~ 7/8）
        var x = getRandom(canvas.width / 8, canvas.width * 7 / 8);
        var y = getRandom(50, 200);
        if (random) {
            var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 2, "#FFF", {
                x: x,
                y: y
            });
            bigbooms.push(bigboom)
        } else {
            // 【避免文案重叠】与上一次文案横坐标保持至少 25% 屏宽间距
            var shapeX = getRandom(canvas.width / 6, canvas.width * 5 / 6);
            if (lastShapeX !== null) {
                var minGap = canvas.width * 0.25;
                var tries = 0;
                while (Math.abs(shapeX - lastShapeX) < minGap && tries < 10) {
                    shapeX = getRandom(canvas.width / 6, canvas.width * 5 / 6);
                    tries++;
                }
            }
            lastShapeX = shapeX;
            var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 2, "#FFF", {
                    // 【文字烟花落点】随机横坐标，避免全部集中在中间（当前 1/6 ~ 5/6 宽）
                    x: shapeX,
                    // 【文字烟花高度】随机范围，数值越小越靠上（当前 80~280）
                    y: getRandom(80, 280)
                },
                document.querySelectorAll(".shape")[parseInt(getRandom(0, document.querySelectorAll(".shape").length))]);
            bigbooms.push(bigboom)
        }
        lastTime = newTime;
    }
    stars.foreach(function() {
        this.paint()
    });
    bigbooms.foreach(function(index) {
        var that = this;
        if (!this.dead) {
            this._move();
            this._drawLight()
        } else {
            this.booms.foreach(function(index) {
                if (!this.dead) {
                    this.moveTo(index)
                } else {
                    if (index === that.booms.length - 1) {
                        bigbooms[bigbooms.indexOf(that)] = null
                    }
                }
            })
        }
    });
    raf(animate)
}
Array.prototype.foreach = function(callback) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] !== null) {
            callback.apply(this[i], [i])
        }
    }
};
var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60)
    };
canvas.onclick = function() {
    var x = event.clientX;
    var y = event.clientY;
    var bigboom = new Boom(getRandom(canvas.width / 3, canvas.width * 2 / 3), 2, "#FFF", {
        x: x,
        y: y
    });
    bigbooms.push(bigboom)
};
var Boom = function(x, r, c, boomArea, shape) {
    this.booms = [];
    this.x = x;
    this.y = (canvas.height + r);
    this.r = r;
    this.c = c;
    this.shape = shape || false;
    this.boomArea = boomArea;
    this.theta = 0;
    this.dead = false;
    this.ba = parseInt(getRandom(80, 200))
};
Boom.prototype = {
    _paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.c;
        ctx.fill();
        ctx.restore()
    },
    _move: function() {
        var dx = this.boomArea.x - this.x,
            dy = this.boomArea.y - this.y;
        this.x = this.x + dx * 0.01;
        this.y = this.y + dy * 0.01;
        if (Math.abs(dx) <= this.ba && Math.abs(dy) <= this.ba) {
            if (this.shape) {
                this._shapBoom()
            } else {
                this._boom()
            }
            this.dead = true
        } else {
            this._paint()
        }
    },
    _drawLight: function() {
        ctx.save();
        ctx.fillStyle = "rgba(255,228,150,0.5)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 3 * Math.random() + 1, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore()
    },
    _boom: function() {
        // 【普通烟花颗粒数量】随机范围，越大越密集（当前 150~350）
        var fragNum = getRandom(150, 350);
        var style = getRandom(0, 10) >= 5 ? 1 : 2;
        var color;
        if (style === 1) {
            color = {
                a: parseInt(getRandom(128, 255)),
                b: parseInt(getRandom(128, 255)),
                c: parseInt(getRandom(128, 255))
            }
        }
        // 【普通烟花爆炸范围】像素半径随机范围，范围越大、大小差异越明显（当前 180~400）
        var fanwei = parseInt(getRandom(180, 400));
        for (var i = 0; i < fragNum; i++) {
            if (style === 2) {
                color = {
                    a: parseInt(getRandom(128, 255)),
                    b: parseInt(getRandom(128, 255)),
                    c: parseInt(getRandom(128, 255))
                }
            }
            var a = getRandom( - Math.PI, Math.PI);
            // 【爆炸形状】粒子按同一半径 r 分布在圆周附近，呈圆形环状散射（0.85~1 控制圆环粗细）
            var r = fanwei * getRandom(0.01, 1.0);
            var x = r * Math.cos(a) + this.x;
            var y = r * Math.sin(a) + this.y;
            // 【普通烟花颗粒半径】随机范围，越小越细小（当前 0.8~2）
            var radius = getRandom(0.8, 2);
            var frag = new Frag(this.x, this.y, radius, color, x, y);
            this.booms.push(frag)
        }
    },
    _shapBoom: function() {
        var that = this;
        // 【文字烟花采样步长】数值越小、文字颗粒越密集（当前 3）
        putValue(ocas, octx, this.shape, 3,
            function(dots) {
                var dx = canvas.width / 2 - that.x;
                var dy = canvas.height / 2 - that.y;
                var color = {
                    a: parseInt(getRandom(128, 255)),
                    b: parseInt(getRandom(128, 255)),
                    c: parseInt(getRandom(128, 255))
                };
                for (var i = 0; i < dots.length; i++) {
                    var x = dots[i].x;
                    var y = dots[i].y;
                    // 【文字烟花颗粒半径】随机范围，越小越细小（当前 0.8~2）
                    var radius = getRandom(0.8, 2);
                    var frag = new Frag(that.x, that.y, radius, color, x - dx, y - dy);
                    that.booms.push(frag)
                }
            })
    }
};
function putValue(canvas, context, ele, dr, callback) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    var img = new Image();
    if (ele.innerHTML.indexOf("img") >= 0) {
        img.src = ele.getElementsByTagName("img")[0].src;
        imgload(img,
            function() {
                context.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.width / 2);
                dots = getimgData(canvas, context, dr);
                callback(dots)
            })
    } else {
        var text = ele.innerHTML;
        context.save();
        // 【文字烟花字号】按字数联动：字数越少越大、越多越小，并带随机抖动
        var len = text.length;
        var baseSize = Math.max(90, 200 - len * 20);
        var fontSize = getRandom(baseSize * 0.55, baseSize * 1.5)
        context.font = "bold " + fontSize + "px \"幼圆\", \"YouYuan\", \"华文圆体\", sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(" + parseInt(getRandom(200, 255)) + "," + parseInt(getRandom(200, 255)) + "," + parseInt(getRandom(200, 255)) + " , 1)";
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        context.restore();
        dots = getimgData(canvas, context, dr);
        callback(dots)
    }
}
function imgload(img, callback) {
    if (img.complete) {
        callback.call(img)
    } else {
        img.onload = function() {
            callback.call(this)
        }
    }
}
function getimgData(canvas, context, dr) {
    var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    var dots = [];
    for (var x = 0; x < imgData.width; x += dr) {
        for (var y = 0; y < imgData.height; y += dr) {
            var i = (y * imgData.width + x) * 4;
            if (imgData.data[i + 3] > 128) {
                var dot = {
                    x: x,
                    y: y,
                    a: imgData.data[i],
                    b: imgData.data[i + 1],
                    c: imgData.data[i + 2]
                };
                dots.push(dot)
            }
        }
    }
    return dots
}
function getRandom(a, b) {
    return Math.random() * (b - a) + a
}
var maxRadius = 1,
    stars = [];
function drawBg() {
    for (var i = 0; i < 100; i++) {
        var r = Math.random() * maxRadius;
        var x = Math.random() * canvas.width;
        var y = Math.random() * 2 * canvas.height - canvas.height;
        var star = new Star(x, y, r);
        stars.push(star);
        star.paint()
    }
}
var Star = function(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r
};
Star.prototype = {
    paint: function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,255,255," + this.r + ")";
        ctx.fill();
        ctx.restore()
    }
};
var focallength = 250;
var Frag = function(centerX, centerY, radius, color, tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.x = centerX;
    this.y = centerY;
    this.dead = false;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color;
    this.alpha = 1;
    this.scatter = false;
    this.vx = 0;
    this.vy = 0
};
Frag.prototype = {
    paint: function() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(" + this.color.a + "," + this.color.b + "," + this.color.c + "," + this.alpha + ")";
        ctx.fill();
        ctx.restore()
    },
    moveTo: function(index) {
        var dx = this.tx - this.x,
            dy = this.ty - this.y;
        if (!this.scatter && Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            this.scatter = true;
            // 【散落水平/竖直初速度】随机范围，越大散得越开
            this.vx = getRandom(-1.5, 1.5);
            this.vy = getRandom(-1.5, 0.5)
        }
        if (!this.scatter) {
            this.x += dx * 0.1;
            this.y += dy * 0.1
        } else {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.06;   // 【重力】越大下落越快
            this.alpha -= 0.02; // 【消散速度】越大消失越快
            if (this.alpha <= 0) {
                this.dead = true;
                return
            }
        }
        this.paint()
    }
};