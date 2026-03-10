import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { v4 as uuid } from "uuid";


const genererChaineAleatoire =(longueur)=> {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let resultat = '';
  for (let i = 0; i < longueur; i++) {
    const index = Math.floor(Math.random() * caracteres.length);
    resultat += caracteres.charAt(index);
  }
  return resultat;
}

const SignCode = () => {

  const [listCode, setListCode] = useState([])

  const getCode = async () => {
    console.log("test");

    try {
      const response = await axios.get('http://localhost:3001/code')
      console.log(response.data.data);
      setListCode(response.data.data)
    } catch (error) {
      console.log(error);

    }

  }

  useEffect(() => {
    getCode()
  }, [])

  useEffect(() => {
    console.log(listCode);

  }, [listCode])

  const handleCreate = async () => {
    const code = genererChaineAleatoire(20)
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await axios.post('http://localhost:3001/code',
        {
          "id_code": uuid(),
          "content_code": code
        }
      )
      alert("code créer avec success")

      getCode()
    } catch (error) {
      console.log(error);

    }

  }

  return (
    <div className='text-normal'>
      <div className='mb-2 flex justify-between'>
        <p className='text-lg'>Code d&apos;inscription</p>
        <div className='text-white flex items-center'>
          <button className='px-2 py-1 bg-primary rounded-sm cursor-pointer' onClick={() => handleCreate()}>Générer un code</button>
        </div>
      </div>
      <hr />
      <div>
        <table className='w-full text-center table-auto min-w-max px-2'>
          <thead>
            <tr className='text-center p-4 py-4'>
              <th className='w-10'>code</th>
              <th>Status</th>
              <th>action</th>
            </tr>
          </thead>
          <tbody>
            {listCode.map((item) => {
              return <tr key={item.id || item.content_code} className='text-center py-5'>
                <td>{item.content_code}</td>
                <td><p>{item.status_file === 0 ? "Libre" : "Utilisé"}</p></td>
                <td><button>Supprimer</button></td>
              </tr>
            })

            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SignCode;