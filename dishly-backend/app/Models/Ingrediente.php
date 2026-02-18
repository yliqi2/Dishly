<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingrediente extends Model
{
    protected $table = 'ingrediente';

    protected $primaryKey = 'id_ingrediente';

    public $timestamps = false;
}
