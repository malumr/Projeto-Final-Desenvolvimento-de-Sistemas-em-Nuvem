import os
from flask import Flask, request, jsonify, send_from_directory
from flask_pymongo import PyMongo
from flask_restful import Api, Resource
from flask_cors import CORS
from bson import ObjectId
from bson.errors import InvalidId

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)
api = Api(app)

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/gerenciamento_tarefas")
app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

usuarios = mongo.db.Usuarios
projetos = mongo.db.Projetos
tarefas = mongo.db.Tarefas
equipes = mongo.db.Equipes


def validar_id(id):
    try:
        return ObjectId(id)
    except InvalidId:
        return None


@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


# ========================
# CRUD Usuários
# ========================
class Usuario(Resource):
    def get(self, id=None):
        if id:
            obj_id = validar_id(id)
            if not obj_id:
                return {'erro': 'ID inválido'}, 400
            u = usuarios.find_one({'_id': obj_id})
            if not u:
                return {'erro': 'Usuário não encontrado'}, 404
            return {
                '_id': str(u['_id']),
                'nome': u.get('nome'),
                'email': u.get('email'),
                '_id_equipe': str(u['_id_equipe']) if u.get('_id_equipe') else None
            }
        output = []
        for u in usuarios.find():
            output.append({
                '_id': str(u['_id']),
                'nome': u.get('nome'),
                'email': u.get('email'),
                '_id_equipe': str(u['_id_equipe']) if u.get('_id_equipe') else None
            })
        return jsonify(output)

    def post(self):
        data = request.json
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip()
        id_equipe = data.get('_id_equipe')

        if not nome:
            return {'erro': 'Campo "nome" é obrigatório'}, 400
        if not email:
            return {'erro': 'Campo "email" é obrigatório'}, 400

        obj_id_equipe = None
        if id_equipe:
            obj_id_equipe = validar_id(id_equipe)
            if not obj_id_equipe or not equipes.find_one({'_id': obj_id_equipe}):
                return {'erro': 'Equipe inválida ou não encontrada'}, 400

        uid = usuarios.insert_one({'nome': nome, 'email': email, '_id_equipe': obj_id_equipe}).inserted_id
        return {'msg': 'Usuário criado', 'id': str(uid)}, 201

    def put(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        data = request.json
        fields = {}
        if 'nome' in data:
            if not data['nome'].strip():
                return {'erro': 'Nome não pode ser vazio'}, 400
            fields['nome'] = data['nome']
        if 'email' in data:
            if not data['email'].strip():
                return {'erro': 'Email não pode ser vazio'}, 400
            fields['email'] = data['email']
        if '_id_equipe' in data:
            if data['_id_equipe']:
                eid = validar_id(data['_id_equipe'])
                if not eid or not equipes.find_one({'_id': eid}):
                    return {'erro': 'Equipe inválida'}, 400
                fields['_id_equipe'] = eid
            else:
                fields['_id_equipe'] = None
        usuarios.update_one({'_id': obj_id}, {'$set': fields})
        return {'msg': 'Usuário atualizado'}

    def delete(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        result = usuarios.delete_one({'_id': obj_id})
        if result.deleted_count == 0:
            return {'erro': 'Usuário não encontrado'}, 404
        return {'msg': 'Usuário deletado'}


# ========================
# CRUD Projetos
# ========================
class Projeto(Resource):
    def get(self, id=None):
        if id:
            obj_id = validar_id(id)
            if not obj_id:
                return {'erro': 'ID inválido'}, 400
            p = projetos.find_one({'_id': obj_id})
            if not p:
                return {'erro': 'Projeto não encontrado'}, 404
            return {'_id': str(p['_id']), 'nome': p.get('nome'), 'descricao': p.get('descricao')}
        output = [{'_id': str(p['_id']), 'nome': p.get('nome'), 'descricao': p.get('descricao')} for p in projetos.find()]
        return jsonify(output)

    def post(self):
        data = request.json
        nome = data.get('nome', '').strip()
        if not nome:
            return {'erro': 'Campo "nome" é obrigatório'}, 400
        pid = projetos.insert_one({'nome': nome, 'descricao': data.get('descricao', '')}).inserted_id
        return {'msg': 'Projeto criado', 'id': str(pid)}, 201

    def put(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        data = request.json
        fields = {}
        if 'nome' in data:
            if not data['nome'].strip():
                return {'erro': 'Nome não pode ser vazio'}, 400
            fields['nome'] = data['nome']
        if 'descricao' in data:
            fields['descricao'] = data['descricao']
        projetos.update_one({'_id': obj_id}, {'$set': fields})
        return {'msg': 'Projeto atualizado'}

    def delete(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        result = projetos.delete_one({'_id': obj_id})
        if result.deleted_count == 0:
            return {'erro': 'Projeto não encontrado'}, 404
        return {'msg': 'Projeto deletado'}


# ========================
# CRUD Tarefas
# ========================
class Tarefa(Resource):
    def get(self, id=None):
        if id:
            obj_id = validar_id(id)
            if not obj_id:
                return {'erro': 'ID inválido'}, 400
            t = tarefas.find_one({'_id': obj_id})
            if not t:
                return {'erro': 'Tarefa não encontrada'}, 404
            return {
                '_id': str(t['_id']),
                'titulo': t.get('titulo'),
                'descricao': t.get('descricao'),
                '_id_projeto': str(t['_id_projeto']) if t.get('_id_projeto') else None,
                'status_atual': t.get('status_atual', 'Pendente'),
                'dt_criacao': t.get('dt_criacao', ''),
                'status_historico': t.get('status_historico', [])
            }
        output = []
        for t in tarefas.find():
            output.append({
                '_id': str(t['_id']),
                'titulo': t.get('titulo'),
                'descricao': t.get('descricao'),
                '_id_projeto': str(t['_id_projeto']) if t.get('_id_projeto') else None,
                'status_atual': t.get('status_atual', 'Pendente'),
                'dt_criacao': t.get('dt_criacao', ''),
                'status_historico': t.get('status_historico', [])
            })
        return jsonify(output)

    def post(self):
        data = request.json
        titulo = data.get('titulo', '').strip()
        if not titulo:
            return {'erro': 'Campo "titulo" é obrigatório'}, 400

        id_projeto = data.get('_id_projeto')
        obj_id_projeto = None
        if id_projeto:
            obj_id_projeto = validar_id(id_projeto)
            if not obj_id_projeto or not projetos.find_one({'_id': obj_id_projeto}):
                return {'erro': 'Projeto inválido ou não encontrado'}, 400

        status = data.get('status_atual', 'Pendente')
        dt = data.get('dt_criacao', '')
        tid = tarefas.insert_one({
            'titulo': titulo,
            'descricao': data.get('descricao', ''),
            '_id_projeto': obj_id_projeto,
            'status_atual': status,
            'dt_criacao': dt,
            'status_historico': [{'status': status, 'dt_status': dt}]
        }).inserted_id
        return {'msg': 'Tarefa criada', 'id': str(tid)}, 201

    def put(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        data = request.json
        fields = {}
        if 'titulo' in data:
            if not data['titulo'].strip():
                return {'erro': 'Título não pode ser vazio'}, 400
            fields['titulo'] = data['titulo']
        if 'descricao' in data:
            fields['descricao'] = data['descricao']
        if 'status_atual' in data:
            fields['status_atual'] = data['status_atual']
        if '_id_projeto' in data:
            if data['_id_projeto']:
                pid = validar_id(data['_id_projeto'])
                if not pid or not projetos.find_one({'_id': pid}):
                    return {'erro': 'Projeto inválido'}, 400
                fields['_id_projeto'] = pid
            else:
                fields['_id_projeto'] = None
        tarefas.update_one({'_id': obj_id}, {'$set': fields})
        return {'msg': 'Tarefa atualizada'}

    def delete(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        result = tarefas.delete_one({'_id': obj_id})
        if result.deleted_count == 0:
            return {'erro': 'Tarefa não encontrada'}, 404
        return {'msg': 'Tarefa deletada'}


# ========================
# CRUD Equipes
# ========================
class Equipe(Resource):
    def get(self, id=None):
        if id:
            obj_id = validar_id(id)
            if not obj_id:
                return {'erro': 'ID inválido'}, 400
            e = equipes.find_one({'_id': obj_id})
            if not e:
                return {'erro': 'Equipe não encontrada'}, 404
            return {'_id': str(e['_id']), 'nome': e.get('nome')}
        output = [{'_id': str(e['_id']), 'nome': e.get('nome')} for e in equipes.find()]
        return jsonify(output)

    def post(self):
        data = request.json
        nome = data.get('nome', '').strip()
        if not nome:
            return {'erro': 'Campo "nome" é obrigatório'}, 400
        eid = equipes.insert_one({'nome': nome}).inserted_id
        return {'msg': 'Equipe criada', 'id': str(eid)}, 201

    def put(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        data = request.json
        nome = data.get('nome', '').strip()
        if not nome:
            return {'erro': 'Nome não pode ser vazio'}, 400
        equipes.update_one({'_id': obj_id}, {'$set': {'nome': nome}})
        return {'msg': 'Equipe atualizada'}

    def delete(self, id):
        obj_id = validar_id(id)
        if not obj_id:
            return {'erro': 'ID inválido'}, 400
        result = equipes.delete_one({'_id': obj_id})
        if result.deleted_count == 0:
            return {'erro': 'Equipe não encontrada'}, 404
        return {'msg': 'Equipe deletada'}


api.add_resource(Usuario, '/usuarios', '/usuarios/<string:id>')
api.add_resource(Projeto, '/projetos', '/projetos/<string:id>')
api.add_resource(Tarefa, '/tarefas', '/tarefas/<string:id>')
api.add_resource(Equipe, '/equipes', '/equipes/<string:id>')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
