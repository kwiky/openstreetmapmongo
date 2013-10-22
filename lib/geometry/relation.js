/* OSM relation object
*
* Stefan Wehner (2012)
*/

exports.Relation = Relation;

function Relation(osm_id,version,visible) {
    this.visible = visible;
    this.nodes = {};  // list of nodes by role
    this.ways = {};   // list of ways by role
    this.osm_id = osm_id;
    this.version = version;
    this.attrs = undefined;
}


Relation.prototype.addTags = function(tags) {
    if (!this.attrs) {
        this.attrs = {};
    }
    for (key in tags) {
        if (tags.hasOwnProperty(key)) {
            this.attrs[key] = tags[key];
        }
    }
}


Relation.prototype.addNodeMember = function(role, node) {
    if (!this.nodes[role]) {
        this.nodes[role] = [];
    }
    this.nodes[role].push(node);
}

// coordinates parameter is only used when relation object is read from DB.
// coordinates is undefined when this function is called during xml parsing
Relation.prototype.addWayMember = function(role, way) {
    // An empty role: '' is treated as role: 'outer'
    role = (role == '') ? 'outer' : role;
    if (!this.ways[role]) {
        this.ways[role] = [];
    }
    this.ways[role].push(way);
}

