<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Valoracion extends Model
{
    protected $table = 'valoracion';

    protected $primaryKey = 'id_valoracion';

    public $timestamps = false;
}
